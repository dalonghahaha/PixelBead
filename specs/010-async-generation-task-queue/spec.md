# Feature 010 — 异步生成任务队列

## Overview

当前 003 是 **同步生成**(用户点生成 → 后端阻塞 → 返回图纸)。对大图(>80×80)存在严重风险:
- HTTP 超时(浏览器默认 30s,代理可能 60s)
- 服务器单线程阻塞,高并发时 P99 延迟飙升
- 用户在等的时候白屏,失败时无重试
- 移动端弱网下几乎必失败

本 spec 提供 **最小可用异步生成**:
- 大图(>80×80 或 >80KB 处理量)走异步队列
- 前端轮询任务状态
- 失败可重试
- 不引入复杂分布式队列(MVP 单进程 RQ 即可)

不在本文范围:分布式队列(Kafka/SQS,Phase 4+ 评估)、实时进度条(算法 P3+ 评估)、AI 任务队列(宪法 §5.2 不做 AI)。

## User Scenarios & Testing

### Scenario 1 — 大图异步生成
**角色**:上传 4MB 高分辨率照片的用户(预计生成 116×116 图纸)
**流程**:
1. 点"生成"
2. 前端立即收到 task_id + 状态 "queued"
3. UI 切换到"正在生成中..."状态 + 进度提示(队列位置/预估时间)
4. 后端 RQ worker 处理,前端每 2s 轮询 `GET /tasks/{id}`
5. 任务完成 → 状态 "complete" + pattern_id → 跳转到图纸页
6. 全程 < 30s 完成

**验收标准**:
- 大图(>80×80)触发异步,小图(≤80×80)仍走同步(快速路径)
- 任务创建后立即返回 task_id(< 200ms)
- 前端轮询 2s 一次,状态变化立即可见
- 任务完成后 pattern 可正常下载(预览/符号/用量)

### Scenario 2 — 中小图同步生成(快路径)
**角色**:上传 500KB 普通照片的用户(预计生成 58×58 图纸)
**流程**:
1. 点"生成"
2. 同步阻塞,直接返回图纸
3. 整个流程 < 5s

**验收标准**:
- ≤80×80 图纸仍走同步路径(< 5s 返回)
- 同步路径不增加额外队列开销
- 前端不显示"生成中..."状态(直接跳转)

### Scenario 3 — 任务失败与重试
**角色**:上传导致后端 OOM/算法失败的边缘情况
**流程**:
1. 任务进入队列
2. worker 处理失败(OOM / 算法异常)
3. 任务状态 "failed" + 错误码
4. 前端展示错误提示 + "重试"按钮
5. 用户点重试 → 新任务入队

**验收标准**:
- 失败任务状态明确("failed" + error_code + error_message)
- 前端展示人类可读错误(非堆栈)
- "重试"按钮可用,新任务关联同一原图
- 重试上限:3 次(防无限循环)
- 失败事件 Sentry 上报(006 协同)

### Scenario 4 — 并发与公平
**角色**:多个用户同时上传大图
**流程**:
1. 用户 A、B、C 同时上传大图
2. 三个任务按 FIFO 入队
3. worker 并发处理(默认 2 worker,可配置)
4. 每个用户看到自己的进度(不感知他人)

**验收标准**:
- 任务按入队顺序处理(FIFO)
- worker 并发数可配置(默认 2,环境变量)
- 用户只看到自己的任务状态(不泄漏其他用户的 task_id)
- 队列深度上限(如 100):超过排队时,新任务返回"系统繁忙,请稍后重试"

### Scenario 5 — 任务结果保留
**角色**:任务完成后 7 天内回访用户
**流程**:
1. 7 天前生成的图纸,用户回到 `/patterns` 看到列表
2. 点击进入图纸页,正常预览/导出

**验收标准**:
- 任务完成后,图纸入库,生命周期同正常图纸
- 任务元数据(原始 task_id/原图 hash)保留 30 天(用于排错),过期清理
- 用户看到的是图纸,不是任务(任务仅作为过渡)

### Scenario 6 — 用户主动取消
**角色**:用户上传大图后,等不耐烦,主动取消
**流程**:
1. 任务排队中,用户点"取消"
2. 后端任务标记"cancelled"
3. worker 跳过 / 提前终止处理
4. UI 回到上传状态

**验收标准**:
- 用户可在 queued / running 状态取消
- 取消后任务标记 cancelled,worker 跳过
- 已生成的部分不持久化(不留垃圾数据)
- 取消事件 Sentry 上报(用于统计放弃率)

## Functional Requirements

### FR-1: 同步 vs 异步路由

- 阈值:图纸格子数 ≤ 80×80 → 同步;> 80×80 → 异步
- 阈值可通过环境变量配置(便于调优)
- 同步路径完全保持现状(003)
- 异步路径:立即返回 `task_id`

### FR-2: 任务创建

- 端点:`POST /tasks`(异步) / `POST /patterns`(同步)
- 入参:图片(原图 base64 或 multipart)、生成参数(规格/尺寸/色板)
- 返回:`{ task_id, status: "queued" | "running" | "complete" | "failed" | "cancelled", pattern_id?, progress? }`
- 任务 ID:UUID v4(全局唯一)

### FR-3: 任务状态查询

- 端点:`GET /tasks/{task_id}`
- 权限:仅任务创建者可查(按 user_id 校验)
- 返回字段:`task_id, status, progress, pattern_id?, error_code?, error_message?, created_at, updated_at`
- `progress`:0-100 整数(粗粒度,如 30/60/90 三阶段)

### FR-4: 任务队列实现

- 队列框架:RQ(Redis Queue,Python 生态最简单)
- Redis:复用现有 Redis 实例(若未部署,新增 docker-compose)
- Worker:独立进程,可配置并发数(默认 2)
- 任务函数:封装现有 003 同步生成逻辑为 `generate_pattern_task`

### FR-5: 任务生命周期

- 状态机:`queued → running → (complete | failed | cancelled)`
- 状态变更:worker 处理时更新 + 持久化到 Redis
- 超时:任务运行 > 60s 自动失败(防止僵尸任务)
- 清理:任务完成后保留 30 天,过期自动删除

### FR-6: 任务取消

- 端点:`POST /tasks/{task_id}/cancel`
- 权限:仅任务创建者
- 行为:标记 cancelled,worker 看到标记后提前终止
- 已生成部分不持久化

### FR-7: 重试机制

- 任务失败时,前端展示"重试"按钮
- 重试:创建新任务(关联同一原图 hash,新 task_id)
- 重试上限:3 次(可配置)
- 重试用尽后,需用户重新上传

### FR-8: 错误处理

- 错误分类:`oom`(内存不足)/ `algorithm_error`(算法异常)/ `timeout`(超时)/ `invalid_input`(输入校验失败)
- 每类错误对应人类可读提示:
  - oom:"图片过大,请尝试压缩或缩小尺寸"
  - algorithm_error:"生成失败,请重试或换张图片"
  - timeout:"生成超时,请重试"
  - invalid_input:"图片格式不支持,请上传 JPG/PNG/WebP"

### FR-9: 限流与公平

- 单用户最大并发任务:2(防止单用户占满队列)
- 全局队列深度上限:100(超过返回 503)
- 限流触发提示:"系统繁忙,请稍后重试"

### FR-10: 监控与埋点

- 006 协同,关键事件:
  - `pb_task_created`(任务创建)
  - `pb_task_started`(worker 开始处理)
  - `pb_task_completed`(任务完成)
  - `pb_task_failed`(任务失败,带 error_code)
  - `pb_task_cancelled`(任务取消)
- Sentry 上报:失败任务 + 异常堆栈
- 队列深度监控:Prometheus metric 或 Sentry custom metric

## Success Criteria

### 定量

- 大图(>80×80)100% 走异步路径
- 小图(≤80×80)100% 走同步路径,延迟不增加
- 任务创建返回 < 200ms(P95)
- 任务状态查询 < 100ms(P95)
- 异步任务完成时间 < 30s(116×116 图纸 P95)
- Worker 并发数可配置,默认 2
- 任务失败重试上限 3 次
- 队列深度上限 100,超过返回 503

### 定性

- 大图生成期间,前端有明确进度反馈
- 任务失败提示人类可读,非技术堆栈
- 用户主动取消后,worker 立即终止,不浪费资源
- 队列实现简单可维护(RQ + Redis,运维成本低)

## Key Entities

- **Task**:`{ task_id, user_id, status, progress, params, result_pattern_id?, error?, created_at, updated_at, retry_count }`
- **TaskStatus**:枚举值 `queued` / `running` / `complete` / `failed` / `cancelled`
- **TaskError**:`{ code, message, stack_trace }`

## Assumptions

- 003 同步生成函数可被 worker 调用(无状态)
- 服务器有足够 RAM(异步任务峰值:2 worker × 单任务内存)
- Redis 实例可复用(若已部署),否则新增 docker-compose
- 大图阈值 80×80 是经验值,可调

## Out of Scope

- **分布式队列**(Kafka/SQS/RabbitMQ) → MVP 不需要,Phase 4+ 评估
- **实时进度条**(基于算法中间状态) → 算法 P3+ 评估
- **优先级队列**(Pro 用户优先) → Phase 4 商业化
- **AI 任务队列** → 宪法 §5.2 不做 AI
- **任务依赖 / 工作流**(DAG) → 当前只需单步生成
- **任务重试的指数退避** → MVP 简单重试即可
- **任务结果持久化到 OSS** → 010 仅任务调度,存储仍是 003 范围

## Clarifications

### Session 2026-09-20

- Q: 同步 vs 异步阈值是多少? → A: 80×80 — 经验值,58×58 不需异步,116×116 需异步;可配置,先按此上线。
- Q: 队列框架用 RQ 还是 Celery? → A: RQ — Python 生态最简单,Redis 后端,单文件配置;Celery 过重,与"轻量"原则冲突。
- Q: Worker 并发数默认多少? → A: 2 — 服务器 8C16G 内存,2 worker × 单任务 2GB 内存 = 4GB 上限,留余量给其他服务。
- Q: 任务结果保留多久? → A: 30 天 — 任务元数据(非图纸)保留 30 天,图纸保留按现有策略(007/017 协同)。
- Q: 用户取消能立即终止 worker 吗? → A: 不能立即终止,但可标记后跳过 — worker 处理中无法强杀,但下次轮询看到 cancelled 会终止后续步骤;最终一致性。
- Q: 010 要不要把分布式 / 优先级队列一起做? → A: 不做 — MVP 单进程 RQ 足够,分布式是 Phase 4+ 的事。
- Q: 010 要不要做任务进度细粒度(每个阶段 5%)? → A: 粗粒度三阶段(30/60/90) — MVP 够用,精细化留作后续。
- Q: 用户在多设备上能看任务状态吗? → A: 能 — task_id 全局唯一,登录态查询即可。