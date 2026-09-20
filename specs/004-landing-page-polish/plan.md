# Implementation Plan — Feature 004 Landing Page Polish

> 主交付物。spec.md 的"做什么"翻译成 plan.md 的"怎么拆 + 怎么排 + 怎么验"。
> 详细 research/decisions 在 `research.md`;数据契约在 `data-model.md` + `contracts/`;验证步骤在 `quickstart.md`。

## Technical Context

| 项 | 值 / 说明 |
|---|---|
| 目标框架 | Next.js 14 App Router + TypeScript(沿用 001) |
| 样式 | Tailwind CSS(沿用 001) |
| 后端契约 | FastAPI `/palettes` 端点(沿用 003)、session cookie(沿用 002) |
| 资产打包 | Next.js `public/` 静态目录(沿用) |
| 中文字体 | `fonts-wqy-microhei`(已装)+ 浏览器原生 fallback |
| 浏览器引擎 | snap chromium 153.x(已装)+ headless 截图(已就位) |
| 测试 | Playwright + `@axe-core/playwright`(本期需装)+ Lighthouse CLI(已有) |
| 目标浏览器 | 现代 evergreens(Chrome 100+ / Safari 15+ / Firefox 100+) |
| 目标设备宽度 | 375 / 414 / 768 / 1280(Tailwind 默认断点已对齐) |
| 关键约束 | 不能改 002 / 003 的接口契约;只能消费 |
| Lighthouse 阈值 | mobile: Perf/Acc/BP/SEO ≥ 90 |

**Unknowns needing research** — 已全部在 `research.md` 里决策完毕(9 个 Decision,无残留 `NEEDS CLARIFICATION`)。

## Constitution Check

> 按 `.specify/memory/constitution.md` 的 Principles + Governance 逐条评估。
> 任一 unjustified violation → ERROR(spec-kit 规定)。

### Principles

1. **Spec 优先于实现** — ✅ PASS
   - 004 已先写 `spec.md`(盘点 + 5 轮 clarify → 16/16 checklist)
   - 本 plan.md 在 spec.md 之后
   - `research.md` 优先记录决策理由,实现阶段才写代码

2. **顺序编号** — ✅ PASS
   - 现有 001 / 002 / 003 / **004**
   - `.specify/init-options.json` `feature_numbering: "sequential"` 一致
   - `.specify/feature.json` 已指向 `specs/004-landing-page-polish`

3. **本地模板可覆盖** — ✅ PASS
   - `.specify/templates/` 当前为空目录(001 spec 沿用 GitHub spec-kit 默认模板)
   - 本 plan 也未引入额外模板

4. **工作目录与 git 分支解耦** — ✅ PASS
   - spec 目录命名 `004-landing-page-polish` 是顺序号,与 git 分支策略独立
   - git 分支策略(主干 / feature / hotfix)由项目自行决定(本期先 main 直 commit)

### Governance

- **Spec 内禁止实现细节** — ✅ PASS
  - spec.md 仅描述 WHAT/WHY,未出现具体技术栈选型
  - research.md 才是技术决策的归宿(spec 与 research 边界清晰)
- **FR 可测试** — ✅ PASS
  - 10 个 FR 每个都有"验收:"句(可机器 / 人工验证)
- **SC 可衡量且面向用户** — ✅ PASS
  - 数字带单位(像素、毫秒、分数),用语面向"用户能看到/完成",非"代码能做到"
- **单次 specify 只写一个 feature** — ✅ PASS
  - 004 专注 Landing Page Polish,i18n/评价/埋点/SES 全部作为后续 spec 锚点
- **写完 spec 立即生成 checklist** — ✅ PASS
  - `checklists/requirements.md` 16/16 全过

**Constitution Check result: ✅ 全部 PASS,无 violation。**

## Architecture (high level)

```
┌─────────────────────────────────────────────────────────────────┐
│                  apps/web (Next.js 14 RSC)                       │
│                                                                 │
│   ┌──────────────┐    ┌──────────────────────────────────┐      │
│   │  layout.tsx  │───▶│  Header.tsx (Server parent)      │      │
│   │ (Server RSC) │    │   ├─ desktop nav                 │      │
│   │  reads cookie│    │   ├─ mobile hamburger            │      │
│   │  via next/   │    │   └─ UserMenu.tsx (Client child) │      │
│   │  headers     │    └──────────────────────────────────┘      │
│   └──────────────┘                                                │
│          │ props {loggedIn, user}                                │
│          ▼                                                       │
│   ┌──────────────────────────────────────────────────────┐      │
│   │  app/page.tsx (Server RSC, FR-1..FR-6 + FR-9 + FR-10)│      │
│   │                                                       │      │
│   │  generateMetadata()  ◀── FR-5 (title/og/twitter)     │      │
│   │                                                       │      │
│   │  Hero           ◀── CTA href 取决于 loggedIn         │      │
│   │  Features (3)   ◀── "N 种" ←─ fetch /palettes (ISR) │      │
│   │  Example card   ◀── <img src="/examples/..."/>       │      │
│   │  Footer         ◀── import Footer from components/    │      │
│   └──────────────────────────────────────────────────────┘      │
│          │                                                       │
│          ▼                                                       │
│   ┌──────────────────────────────────────────────────────┐      │
│   │  components/Footer.tsx (Server RSC)                  │      │
│   │  3-col desktop / stacked mobile                      │      │
│   └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
            │                                                          │
            │ server-side fetch (with cache)                           │
            ▼                                                          │
   ┌─────────────────────────────────────┐    ┌────────────────────────┐
   │  apps/api (FastAPI, 沿用 003)       │    │  public/ (static)      │
   │  GET /palettes → 数组 → 长度 N      │    │  examples/original.jpg │
   └─────────────────────────────────────┘    │  examples/pattern.png  │
                                              │  favicon.svg           │
                                              │  og.png 1200×630       │
                                              └────────────────────────┘
```

**关键设计点**:

- 全 Server Component 优先,只在 UserMenu(下拉展开)用 Client Component
- 数据流单向:layout 读 cookie → 传 prop → page.tsx 用 prop 决定 CTA 渲染
- 静态资源与动态数据分离:examples/*.jpg|png 是 checked-in 静态资产;/palettes 是运行时 fetch(带 ISR 缓存)

## Module Breakdown

7 个 Module,每个独立可验收,按依赖排序实现。

### Module A — Static assets (1 次性,可最先做)
**职责**:把所有"图片类"资源准备好
**Owner**: 老孙
**依赖**: 无
**产出文件**:
- `apps/web/public/examples/original.jpg` (≤ 200KB, Unsplash CC0)
- `apps/web/public/examples/pattern.png` (≤ 300KB, pypindou 生成)
- `apps/web/public/favicon.svg` (8×8 像素拼豆风格,老孙手画)
- `apps/web/public/og.png` (1200×630,SNS 分享卡)
- `apps/web/scripts/gen-example-pattern.py` (一次性脚本)
**详细决策**: 见 `research.md` Decision 1/2/5/7

### Module B — `app/page.tsx` 改写
**职责**: 实现 FR-1 / FR-3 / FR-5 / FR-6 / FR-9 / FR-10 的 page 部分
**Owner**: 老孙
**依赖**: Module A(示例图就位后引入 `<img>`)
**具体改动**:
- 顶部加 `export const metadata` 或 `export function generateMetadata()` (FR-5)
- Hero CTA 改成根据 `loggedIn` 决定 href 的 Server Component 逻辑(FR-3)
- "26 种" 改成动态拉 `/palettes` 长度 + cache + fallback(FR-6)
- 示例卡 `<div>` mock 改为 `<img src="/examples/original.jpg" alt="..."/>` + `<img src="/examples/pattern.png" alt="..."/>`(FR-1)
- 标题层级:h1 → h2 → h3(FR-9)
- 所有 `<img>` 加 alt(FR-9)
- CTA 加 hover/active/loading 视觉态(FR-10)
- Tailwind 响应式类(FR-4)
**详细决策**: 见 `research.md` Decision 3/4/6

### Module C — Layout + Header 登录态
**职责**: 实现 FR-2(Header auth-aware)+ FR-3 的 server 侧 cookie read
**Owner**: 老孙
**依赖**: Module B(page.tsx 已能接受 loggedIn prop)
**具体改动**:
- `app/layout.tsx`:Server Component,从 `next/headers.cookies()` 读 session cookie,lookup user,传 prop 给 Header
- `components/Header.tsx`:Server Component 父,渲染时根据 `loggedIn` 切两套 UI(桌面 / 移动)
- 新建 `components/Header.UserMenu.tsx`:Client Component,只负责头像下拉展开/收起
- 移动端(< 768px):汉堡包按钮(点开抽屉式菜单)
**详细决策**: 见 `research.md` Decision 3

### Module D — Footer 完整化
**职责**: 实现 FR-7
**Owner**: 老孙
**依赖**: 无(独立模块)
**具体改动**:
- `components/Footer.tsx`:重写,三段(brand+简介 / 链接列 / 版权)
- 桌面 ≥ 1024px:三列并排
- 平板 768px:三段两列堆叠
- 手机 < 768px:三段单列
**详细决策**: 无特殊 research 决策(Tailwind 响应式)

### Module E — 移动端响应式精修
**职责**: 实现 FR-4(响应式断点 + 热区)
**Owner**: 老孙
**依赖**: Module B / C / D 完成
**具体改动**:
- 全局检查所有 CTA / Header 链接的 padding,确保 ≥ 44×44px
- Tailwind 响应式类补齐(已大部分在 Module B 用上,这里收尾)
- 移动端字体最小 16px(防 iOS 自动放大)
**验证**: snap chromium 截 4 档宽度

### Module F — 视觉验证 & a11y
**职责**: 验收 FR-1 / FR-4 / FR-5 / FR-7 / FR-9 / FR-10
**Owner**: 老孙
**依赖**: Module A-E 全部完成
**具体改动**:
- 装 `@axe-core/playwright` + 写 `apps/web/tests/axe.spec.ts`
- 跑 Lighthouse mobile 四项,确认 ≥ 90
- 跑 axe-core,确认 0 critical + 0 serious
- snap chromium 截 4 档宽度,老孙肉眼视觉验收
- 检查 og:image 在 OG Debugger 预览正确
**详细决策**: 见 `research.md` Decision 8/9

### Module G — 文档 & 日志
**职责**: 把 005/006/007/008 spec 锚点写进 README,补 memory 日志
**Owner**: 老孙
**依赖**: Module F 通过
**具体改动**:
- `README.md` 加一节"后续规划 spec"列 005/006/007/008
- `memory/2026-09-20.md` 补完今日工作日志
- 单个 commit 收尾,写完整 commit message(见 quickstart.md 末尾)

## Implementation Order (dependency-ordered)

```
A (静态资源, 可并行)
 │
 ├─► B (page.tsx)  ─┐
 │                  │
 ├─► C (Header)  ───┤
 │                  ├─► E (响应式精修) ─► F (视觉/a11y) ─► G (文档)
 └─► D (Footer)  ───┘
```

- A 第一(无依赖,可立即做)
- B / C / D 第二(可并行,各自独立)
- E 第三(依赖 B+C+D)
- F 第四(验收)
- G 第五(收尾)

## Risks & Mitigations

| # | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R1 | 002 session cookie name 不一定是 `pixelbead_session`,lookup 函数也不一定存在 | FR-2/FR-3 阻塞 | tasks 阶段先去 `apps/api/` 查 002 实现,确认 cookie 名 + decoder 函数,再写 layout.tsx;若不存在则按 spec 加一个最小化的 decoder |
| R2 | 003 `/palettes` 响应可能是数组直接,也可能是 `{ palettes: [] }` 包装 | FR-6 fallback 触发或数字错误 | tasks 阶段先 `curl localhost:8000/palettes` 拿真实响应,根据 shape 写解析 |
| R3 | pypindou 在主机 Python 环境可能未装(虽然 001 spec 说装了) | Module A 阻塞 | tasks 阶段先 `python3 -c "import pypindou"` 确认,没装就装 |
| R4 | snap chromium 在 sandbox 内写文件受 AppArmor 限制(已遇到过 `/tmp/` 写不进去) | Module F 视觉验证失败 | 沿用已验证路径:写到 `/root/snap/chromium/common/` 再 `cp` 出来 |
| R5 | Lighthouse 在本机跑可能因网络/CPU 不稳定给出波动分数 | Module F 不通过 | 跑 3 次取最高,或加 `--throttling.cpuSlowdownMultiplier=1` 减少假阳性 |
| R6 | 老孙手画 favicon.svg 视觉质量有限 | 用户体验弱 | spec 已明确"先业余版,后续替换",commit message 留好替换说明 |
| R7 | axe-core 0 critical 难保证(常见问题是 contrast / heading skip) | Module F 不通过 | tasks 阶段为常见问题预先在代码上修(heading skip / alt text / focus-visible),剩下极少数手动调色 |

## Validation Strategy

按 `quickstart.md` 的 6 个 Module 验证步骤顺序跑。汇总后写进 commit message。

具体验证清单(对应 SC):
- ✅ 桌面 1280 / 平板 768 / 手机 375 三档 headless 截图视觉通过 → FR-4
- ✅ Lighthouse mobile: Perf ≥ 90 / Acc ≥ 90 / BP ≥ 90 / SEO ≥ 90 → SC quantitative
- ✅ LCP < 2.5s / CLS < 0.1 → SC quantitative
- ✅ axe-core 0 critical + 0 serious → FR-9 + SC quantitative
- ✅ og:image ≥ 1200×630 + FB Sharing Debugger 预览正确 → FR-5
- ✅ FR-1~FR-10 每个的"验收:"句 → module-by-module 验证

## Future Spec Anchors (不实现,只做文档铺垫)

| 编号 | 主题 | 内容(预告) |
|---|---|---|
| 005 | i18n | 引入 next-intl,支持中英双语切换 |
| 006 | 社会证明 | 用户评价区块 / 案例区块 / 用户数徽章 |
| 007 | 行为埋点 | GA4 / Plausible / 自建事件追踪 |
| 008 | SEO | sitemap.xml / robots.txt / 结构化数据(Schema.org) |

## Out of Scope (re-affirmed)

- Cookie banner / 隐私政策页(合规相关)
- A/B test 框架
- 完整 a11y drawer 键盘导航(只做最小可用)
- 真实图案库 / 案例库(需要后端)
- Header 头像上传 / 修改(在 005 或独立 spec)

---

**Plan status: ✅ Constitution Check 全过,可进 `/speckit-tasks` 阶段。**