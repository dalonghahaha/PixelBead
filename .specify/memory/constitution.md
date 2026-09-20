# Project Constitution — PixelBead

<!-- 初版:2026-09-20 | status: active -->
<!-- 修订:2026-09-20 | status: active | 沉淀 ROADMAP 治理原则 -->

> 本文件是 PixelBead 项目的治理宪法。任何 spec/plan/tasks 的产出与变更不得违背本文件。

---

## 第 1 章 — 项目身份与愿景

**产品定位**:上传图片 → 3 秒生成可打印拼豆图纸的开源 Web 工具。

**核心策略**:把基础体验打磨扎实,不追运营重和开发重的功能。

**差异化立足点**:开源 Web + 无注册强迫 + 可自部署 + 桌面友好 —— 国内独此一家。

**北极星指标**(周维度):
- Weekly Generated Patterns(每周生成图纸数,去重)
- PDF / Print Export Rate(导出 PDF 的用户占比)
- 7-Day Returning Users(7 日内回访用户数)

**月维度指标**:
- Lighthouse Mobile Score(4 项平均)

---

## 第 2 章 — Spec 流程铁律

### 2.1 Spec 优先于实现

任何新功能必须先有 `specs/<NNN>-<short-name>/spec.md`,再讨论代码。无 spec 无实现。

### 2.2 SDD 工作流顺序

`constitution → specify → clarify → plan → tasks → checklist → analyze → implement → converge`

- 单个 spec 严格按顺序走全流程,不得跳级。
- 跨 spec 一致性检查在所有 Phase spec 走完 specify/plan/tasks 后,统一跑 `analyze`。
- `taskstoissues` 跳过(无 GitHub MCP)。

### 2.3 顺序编号

feature 目录统一 `NNN-` 三位顺序号(由 `init-options.json` 控制)。新增 spec 必须扫描 `specs/` 取下一个号。

### 2.4 本地模板优先

`.specify/templates/` 下的 spec-template / checklist-template 优先于远程 preset。

### 2.5 工作目录与 git 分支解耦

spec 目录命名不绑定分支,git 端的分支策略由项目自行决定。

---

## 第 3 章 — Spec 内容纪律

### 3.1 Spec 内禁止出现实现细节

禁止出现:框架名(Next.js / FastAPI / Tailwind 等)、语言(TS/Python 等)、库名(jspdf / reportlab / zustand 等)、API 路径(`/api/foo`)。

只描述 **WHAT/WHY**,不描述 HOW。HOW 属于 plan 阶段。

### 3.2 Functional Requirements 必须可测试

每条 FR 必须有明确的验收标准,且验收标准必须可由人或自动化测试判定。

### 3.3 Success Criteria 必须可衡量且面向用户

- 定量:数字 + 阈值(如 "Lighthouse ≥ 90")
- 定性:用户视角(如 "5 秒内明白产品价值")

禁止"做得更好"、"更友好"等无量化形容词。

### 3.4 单次 specify 只写一个 feature

不得批量合并多个 feature 进同一个 spec.md。

### 3.5 checklist 必须先于 plan

每次写完 spec 立即生成 `checklists/requirements.md`,自检通过才进 plan 阶段。

---

## 第 4 章 — 产品治理原则(从 ROADMAP 沉淀)

### 4.1 阶段边界

| 阶段 | 时间窗 | 目标 |
|---|---|---|
| Phase 1 — 基础体验闭环 | Q4 2026 ~ Q1 2027 | 上传→编辑→导出 PDF+Excel,零摩擦、无外部工具 |
| Phase 2 — 轻量编辑增强 | Q2 2027 | 小幅修正不切到 PS/Aseprite |
| Phase 3 — 拓展打印场景 | Q3 2027 | 覆盖不同底板、不同打印需求 |
| Phase 4 — 商业化 | Q4 2027+ | 引入会员体系,可持续运营 |

**节奏**:每个阶段结束,核心场景都"端到端跑通",不堆功能。

### 4.2 P0/P1 优先级模型

- **⭐ P0** — 决定核心闭环,不做用户跑不通最终流程
- **P0** — 必须做(基础体验/基础设施)
- **P1** — 应该做(用户体验加分)
- **P2** — 可以等(收益未明)

### 4.3 开源原则

- 核心算法依赖 **Apache 2.0** 开源项目(pypindou),保持开源血统
- 不引入专有 SaaS 锁定作为核心依赖(埋点/监控可选自托管替代)
- 用户可自部署是核心卖点,任何架构决策不得破坏可自部署性

### 4.4 轻量原则

- 单功能 ROI 不明 → 不做(避免"豆仓管理"类复杂 CRUD)
- 单功能开发量 > 2 周 → 重新评估必要性(避免"完整画布编辑器")
- 优先做"修补级"工具而非"完整级"工具

### 4.5 诚实原则

- 数字、示例、色板数等可验证内容必须真实,不得 mock
- 失败/降级路径必须明确(spec 必填)
- 隐私政策透明,不强注册、不滥用数据

### 4.6 隐私原则

- 用户上传图片 30 天自动清理
- 不引入强 cookie banner(Sentry/Plausible 类隐私友好工具优先)
- 不收集与功能无关的用户数据

---

## 第 5 章 — 明确不做清单(Out of Scope,持久生效)

> 以下功能 **不在任何 spec 范围**。任何时候重新评估都需要单独决策 + 修订本宪法,不得默认加回。

### 5.1 🚫 运营重(需持续 BD / 审核 / 内容运营)

| 功能 | 不做的原因 |
|---|---|
| 图纸公开库 / UGC 社区 | 需 24h 审核、举报处理、版权审核、防灌水 |
| IP 主题聚合页(泡泡玛特/鬼灭/星露谷…) | 需持续谈 IP 合作、内容生产 |
| 拼豆大赛 / 话题活动 | 需运营节奏、社群维护、奖品机制 |
| 拼豆地图(线下店合作) | 需 BD 谈商家、地推 |
| 周边电商导流(淘宝联盟) | 需选品、合规审核 |

### 5.2 🚫 费时费力(单功能开发量大、ROI 不明)

| 功能 | 不做的原因 |
|---|---|
| 像素画布编辑器(完整版) | 2-4 周起步;用户可用 PS 替代 |
| 多图层(立体拼豆) | 编辑器叠加层,小众 |
| AI 文字生图 | 需 prompt 工程 + 限速 + 计费 + 风格 LoRA |
| AI 风格转换 | 同上,需 A/B 多风格 |
| 智能色号推荐(ML/规则引擎) | 依赖用户库存数据 |
| 豆仓管理 | 库存扣减/提醒/合并,逻辑复杂 |
| 移动 App(RN/Flutter 包壳) | 投入产出比低,Web 已能覆盖 90% |
| 实物→图纸 | 图像识别 + 重建算法,开发量大 |
| 3D 预览 | WebGL + 360° 旋转,需求弱 |

### 5.3 🚫 现阶段不做(用户基数大了再说)

| 功能 | 不做的原因 |
|---|---|
| 团队协作 / 多用户编辑 | 单用户场景未跑通 |
| 桌面客户端 | Web 已能覆盖 |
| 直播 / 视频教程 | 内容生产,不是工具能力 |
| 跨境支付 / 多币种 | 海外用户基数未到 |

### 5.4 🚫 已砍(ROADMAP 决策,不复活)

- ~~013 同色高亮~~(PDF 每格已印色号,无需额外高亮)
- ~~014 进度跟踪~~(物理拼豆本身就是进度)
- ~~018 个人收藏/标签~~(纯 CRUD,过度设计)

---

## 第 6 章 — 技术债与基础设施清单

| 项 | 优先级 | 阶段 |
|---|---|---|
| 异步队列(大图生成风险) | P0 | Phase 1 |
| 文件存储(本地 → S3/MinIO) | P1 | Phase 1 末 |
| 限流(上传/生成/API) | P0 | Phase 1 |
| 监控告警(CPU/内存/磁盘/错误率) | P0 | Phase 1 |
| 数据库备份(每日自动 + 异地) | P1 | Phase 1 |
| 公开图纸 CDN 加速 | P2 | Phase 3 |

---

## 第 7 章 — Governance 治理流程

### 7.1 spec 创建流程

1. 扫描 `specs/` 取下一个顺序号
2. 建目录 `specs/NNN-<short-name>/`
3. 写 `spec.md`(只 WHAT/WHY)
4. 写 `checklists/requirements.md`
5. 自检通过 → `clarify`(最多 5 个问题)
6. `plan.md` + `research.md` + `data-model.md` + `quickstart.md` + `contracts/`
7. `tasks.md` 按用户故事分组
8. 跨 spec 一致性 → `analyze`

### 7.2 spec 修订流程

- Spec 重大调整需在原 spec.md 顶部加 `<!-- 修订:YYYY-MM-DD | status: ... -->` 注释
- 已砍功能需移入本宪法 §5.4,不得从 spec 列表静默删除
- 新增功能必须评估是否进入 ROADMAP,否则视为 scope creep

### 7.3 Constitution 修订流程

- 修订本文件必须明确 `<!-- 修订:YYYY-MM-DD | status: active | 说明 -->`
- 新增"明确不做"项必须给"不做的原因"列
- 删除"明确不做"项需经显式决策,不得默认复活

---

## 第 8 章 — Open Items

(暂无,后续按需补充)