# Feature 006 — 行为埋点 + 错误监控

## Overview

PixelBead 当前没有行为埋点和错误监控,导致:
- 北极星指标(每周生成数、PDF 导出率、7 日回访)无法量化评估
- 错误(生成失败、上传失败、API 500)只能靠用户反馈发现,滞后且片面
- 性能指标(LCP/FID/CLS)无真实用户监控(RUM)

本 spec 引入 **最小可用、隐私友好、可自托管** 的埋点 + 错误监控基础设施:

- **埋点**:Plausible(自托管或云),无 cookie banner,GDPR 友好
- **错误监控**:Sentry(自托管或云),错误 + 性能双轨

不在本文范围:用户画像/分群、A/B test 框架、营销漏斗(宪法 §5 明确不做)。

## User Scenarios & Testing

### Scenario 1 — 产品迭代决策需要数据
**角色**:老孙评估"P0 导出闭环是否真的跑通"
**流程**:
1. 进入 Plausible 仪表盘
2. 查看"过去 7 天"的事件:注册、登录、生成开始/成功/失败、PDF 导出、Excel 导出、分享点击
3. 导出率 ≥ 50% → P0 闭环达成; < 30% → 需要看漏斗诊断

**验收标准**:
- Plausible 仪表盘能看到至少 7 个核心事件的自定义指标
- 事件携带必要属性(用户 ID 哈希、图纸 ID、来源渠道、是否成功)
- 7 天窗口数据完整(无丢失)

### Scenario 2 — 用户报错排查
**角色**:用户反馈"上传后一直转圈",老孙需要定位
**流程**:
1. 接到用户截图/描述(时间、错误信息)
2. 进入 Sentry,按时间筛选 + 浏览器筛选
3. 找到对应错误堆栈、面包屑(用户路径)、上下文(URL/User ID)
4. 定位是前端上传逻辑还是后端处理逻辑

**验收标准**:
- Sentry 能看到前端 + 后端两端的错误(同项目)
- 每条错误带:时间、用户 ID 哈希、URL、浏览器/OS、堆栈、面包屑
- 错误分级:fatal / error / warning 区分
- 性能问题(慢 API)也能在 Sentry Performance 看

### Scenario 3 — 真实用户性能监控
**角色**:老孙评估移动端性能
**流程**:
1. 进入 Sentry Performance
2. 查看 `/generate` 页面 P75 加载时间、LCP、FID、CLS
3. 按浏览器/网络/地区切片,定位性能瓶颈

**验收标准**:
- Sentry Performance 包含页面加载 + API 调用两类事务
- P50/P75/P95 分位数可查
- 按浏览器/OS/地区切片可用

### Scenario 4 — 隐私合规(欧盟用户)
**角色**:欧盟用户访问 PixelBead
**流程**:
1. 进入站点,无 cookie banner 弹窗(Plausible/Sentry 不写追踪 cookie)
2. 数据采集匿名化(用户 ID 哈希、不存 IP、不跨站追踪)
3. 隐私政策页说明所用工具 + 数据流向

**验收标准**:
- 全站无 cookie banner(GDPR/Plausible 模式)
- 隐私政策页明列工具清单 + 数据流向 + 用户权利
- 用户可申请导出/删除个人数据(联系邮箱)

## Functional Requirements

### FR-1: Plausible 接入

- 自托管 Plausible 或云版(视预算决定;自托管需 docker-compose 一键起)
- 域名注册 + 站点配置
- 隐私代理脚本挂载(域名 `pixelbead.app` 或子域 `stats.pixelbead.app`)
- 无 cookie、无 cross-site tracking、无 IP 存储

### FR-2: 关键事件埋点

至少包含以下事件(命名规范:`pb_<domain>_<action>`):

| 事件 | 触发时机 | 关键属性 |
|---|---|---|
| `pb_auth_signup` | 注册成功 | `source`(邀请/直接) |
| `pb_auth_login` | 登录成功 | `method`(密码/第三方) |
| `pb_generate_start` | 用户点"生成" | `image_size_kb`,`bead_size` |
| `pb_generate_success` | 生成成功 | `duration_ms`,`pattern_id`,`bead_count` |
| `pb_generate_failure` | 生成失败 | `error_code`,`duration_ms` |
| `pb_export_pdf` | PDF 下载 | `pattern_id`,`page_count`,`pdf_size_kb` |
| `pb_export_usage_xlsx` | Excel 下载 | `pattern_id`,`row_count` |
| `pb_export_usage_csv` | CSV 下载 | `pattern_id`,`row_count` |
| `pb_share_click` | 分享按钮点击 | `pattern_id`,`channel`(复制链接/...) |
| `pb_landing_cta_click` | 首页 CTA 点击 | `position`(hero/...) |

事件属性统一 `user_id_hash`(SHA256(email+salt),不可逆),便于聚合分析。

### FR-3: 自定义漏斗

在 Plausible 配置以下漏斗(用于北极星指标):
- **生成漏斗**:landing → upload → generate_start → generate_success
- **导出漏斗**:generate_success → export_pdf → export_usage_xlsx
- **注册转化漏斗**:landing → login → signup

### FR-4: Sentry 接入

- Sentry 项目:前后端共一项目(便于关联)或分项目(前端 `pixelbead-web`、后端 `pixelbead-api`)
- DSN 通过环境变量注入(自托管需另配)
- Source Map 上传(构建时),便于堆栈反解
- Release 版本绑定(Git SHA 短码)

### FR-5: 前端错误捕获

- 全局 `window.onerror` + `unhandledrejection` 捕获
- React 错误边界(根 ErrorBoundary + 关键路径局部 ErrorBoundary)
- 用户上下文:user_id_hash、URL、浏览器/OS、Locale

### FR-6: 后端错误捕获

- FastAPI 异常中间件 + Sentry SDK
- 关键路径手动上报(`capture_message`):生成失败、导出失败、限流触发
- 用户上下文:user_id_hash、请求路径、IP 哈希

### FR-7: 性能监控(Sentry Performance)

- 前端:页面加载事务(`/`, `/generate`, `/patterns`)
- 前端:关键 API 调用事务(`POST /patterns`, `GET /palettes`)
- 后端:API 端点自动 instrumentation
- 采样率:生产 10%,开发 100%

### FR-8: 告警(可选)

- Sentry Alert:fatal 错误 5 分钟内 ≥ 3 次 → 邮件/IM 通知
- Plausible Uptime Monitoring(可选):站点宕机 1 分钟告警

### FR-9: 隐私合规

- 隐私政策页(`/privacy`)新增"我们使用的工具"章节,明列 Plausible + Sentry
- 用户数据权利:邮箱申请导出/删除(老孙手动响应,1 周内)
- 不引入 cookie banner(GDPR/Plausible 模式)

### FR-10: 部署与配置

- 自托管版:`docker-compose.yml` 新增 Plausible + Sentry 服务(或独立 repo)
- 云版:配置环境变量 + DNS
- CI 中:构建时注入 Sentry DSN + release 版本号

## Success Criteria

### 定量

- Plausible 核心 10 个事件 7 天采集完整率 100%(无事件丢失)
- Sentry 错误捕获率 ≥ 95%(手动注入测试错误,验证能收到)
- Sentry Performance P75 LCP 数据可查
- 全站无 cookie banner(自动化测试:无 cookie 写入除 session cookie 外)
- Lighthouse Best Practices 仍 ≥ 95(Plausible/Sentry 不拖分)

### 定性

- 老孙能在 Plausible 仪表盘直接看到 3 个北极星指标
- 老孙能在 Sentry 5 分钟内定位用户报错的根因
- 欧盟用户访问无 cookie banner,隐私政策清晰

## Key Entities

- **Event**(Plausible):`name`、`url`、`props`、`user_id_hash`
- **ErrorEvent**(Sentry):`message`、`stack`、`level`、`user_id_hash`、`tags`、`breadcrumbs`
- **PerformanceTransaction**(Sentry):`op`、`name`、`duration`、`tags`

## Assumptions

- 002-user-auth 提供 user_id(可哈希)
- 自托管 Plausible 占用约 512MB RAM(参考 docker-compose 文档)
- Sentry 自托管最小占用 2GB RAM(参考官方);若资源不足,先用 sentry.io 云版
- 域名已有 `pixelbead.app` 或可注册子域 `stats.pixelbead.app`

## Out of Scope

- **用户画像 / 分群** → 隐私原则不允许
- **A/B test 框架** → Phase 3+ 视需求评估
- **营销漏斗 / 转化率优化工具** → 宪法 §5.2 不做
- **付费分析工具**(Mixpanel/Amplitude) → 隐私不友好
- **用户回放(Session Replay)** → 隐私敏感,不做
- **热力图 / 点击图** → 隐私 + 性能开销,不做
- **BI / 数据仓库**(ClickHouse/BigQuery) → 当前 Plausible/Sentry 足够
- **数据导出 / ETL** → 暂不投入

## Clarifications

### Session 2026-09-20

- Q: Plausible 自托管还是云版? → A: 优先云版(`plausible.io`,约 9$/月)— 自托管需额外维护成本,与"开源小团队"定位不符;若需 GDPR/数据出境合规,再切自托管。
- Q: Sentry 自托管还是云版? → A: 优先云版(`sentry.io`,免费层 5K 错误/月)— 自托管资源占用大,与"轻量"原则冲突。
- Q: 埋点粒度到什么程度? → A: 北极星指标 + 漏斗诊断够用即可 — 10 个核心事件 + 3 个漏斗,不堆砌。事件属性严格限制,不收集 PII(密码/邮箱明文/IP 原始值)。
- Q: 错误监控采样率多少? → A: 错误 100%,性能 10% — 错误不能丢,性能采样降低成本。
- Q: 隐私政策谁来写? → A: 老孙手写 — 一页纸,工具清单 + 数据流向 + 联系方式,不做法律意见。
- Q: 006 要不要把告警 + uptime monitoring 都做了? → A: 告警基础版(Sentry Alert),uptime monitoring 留作可选增强 — 当前优先让数据可见,告警是 Nice-to-have。