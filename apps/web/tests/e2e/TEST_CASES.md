# PixelBead 回归测试用例库

> **目的**：每次上线前跑一遍，发现 UI 回归 / a11y 退化 / 功能崩。
> **工具**：Playwright + axe-core + 系统 Chromium
> **跑**：`cd apps/web && pnpm test:e2e`

---

## 1. 测试矩阵

| 页面 | Smoke | A11y (axe) | 视觉基线 | 交互 |
|---|---|---|---|---|
| `/` (home) | ✓ | ✓ | ✓ | hero CTA / locale |
| `/generate` | ✓ | ✓ | ✓ | 表单字段 / 守卫跳转 |
| `/patterns` | ✓ | ✓ | ✓ | view modal / tab / 删除 / CSV 下载 |
| `/patterns/[id]` | ✓ | ✓ | ✓ | visibility / 用量表 / PDF |
| `/docs` | ✓ | ✓ | ✓ | TOC anchor 跳转 |
| `/login` | ✓ | ✓ | — | 表单字段 |

**Smoke**: 页面加载、无 JS console error、无网络 4xx/5xx  
**A11y**: axe-core wcag2a + wcag2aa,0 critical + 0 serious  
**视觉基线**: 全页截图 diff(maxDiffPixelRatio 2%)  
**交互**: 关键功能可点、表单可填、modal 可开关

---

## 2. 公共 Setup

```ts
// 跑在 port 3100 (避开 3000 的 standalone production build)
baseURL = http://127.0.0.1:3100
viewport = 1280×720
browser = Chromium (系统 /usr/bin/chromium-browser,不下载 Playwright 自带)
```

**Auth mock**（测试隔离,不影响真后端）：

```ts
// 已登录态:通过 context.addCookies + page.addInitScript
await context.addCookies([{ name: 'pixelbead_token', value: 'e2e-mock', ... }]);
await page.addInitScript(() => {
  localStorage.setItem('pixelbead_token', 'e2e-mock');
  localStorage.setItem('pixelbead_user', JSON.stringify({...}));
});
```

---

## 3. 详细用例

### HOME (`/`)

| ID | 名称 | 期望 |
|---|---|---|
| H-01 | 页面加载无 JS error | `page.on('pageerror')` 0 触发 |
| H-02 | axe wcag2aa 通过 | 0 critical + 0 serious |
| H-03 | 截图全页匹配基线 | maxDiffPixelRatio < 0.02 |
| H-04 | hero h1 "PixelBead" 可见 | `getByRole('heading')` |
| H-05 | logo (`/favicon.svg`) 正确加载 | `naturalWidth > 0` |
| H-06 | 3 个 features 渲染 | 3 个 section |
| H-07 | footer 链接到 /docs | `<a href="/docs">` |

### GENERATE (`/generate`)

| ID | 名称 | 期望 |
|---|---|---|
| G-01 | 页面加载无 JS error | — |
| G-02 | axe 通过 | 0 critical + 0 serious |
| G-03 | 截图匹配 | — |
| G-04 | 未登录 redirect `/login` | URL 含 `/login` |
| G-05 | 已登录显示表单 | h1 "上传图片 → 拼豆图纸" 可见 |
| G-06 | 所有 label/input 配对 | 6+ `htmlFor`/`id` 对应 |
| G-07 | palette select 加载选项 | `<select>` 有 option |

### PATTERNS (`/patterns`)

| ID | 名称 | 期望 |
|---|---|---|
| P-01 | 页面加载无 JS error | — |
| P-02 | 未登录 redirect `/login` | URL 含 `/login` |
| P-03 | 已登录显示卡片网格 | `.grid` 存在 |
| P-04 | axe 通过 | 0 critical + 0 serious |
| P-05 | 截图匹配 | — |
| P-06 | 点「查看」弹 modal | `[role="dialog"]` 可见 |
| P-07 | modal 有 tab (preview/symbol) | 2 个 tab button |
| P-08 | modal 显示色号统计 | 「色号统计」标题 + chip 网格 |
| P-09 | modal 下载按钮可用 | `<a download>` 存在 |
| P-10 | 点「删除」弹 confirm | window.confirm 触发 |
| P-11 | modal 内 axe 通过 | 0 critical + 0 serious |

### PATTERN DETAIL (`/patterns/[id]`)

| ID | 名称 | 期望 |
|---|---|---|
| PD-01 | 页面加载 | — |
| PD-02 | 显示预览图 | `<img>` 存在 |
| PD-03 | 显示符号图 | `<img>` 存在 |
| PD-04 | 显示 metadata (尺寸/色卡/规格) | 4 个 grid item |
| PD-05 | 显示 UsageTable | 表格 + 导出按钮 |
| PD-06 | visibility toggle 工作 | 按钮可点 + state 变化 |
| PD-07 | axe 通过 | 0 critical + 0 serious |

### DOCS (`/docs`)

| ID | 名称 | 期望 |
|---|---|---|
| D-01 | 页面加载 | — |
| D-02 | 5 个 section 全部渲染 | id 命中: quickstart / params / board-size / download / faq |
| D-03 | TOC anchor 跳转工作 | 点 TOC 链接后 URL hash 改变 |
| D-04 | axe 通过 | 0 critical + 0 serious |
| D-05 | 截图匹配 | — |

### LOGIN (`/login`)

| ID | 名称 | 期望 |
|---|---|---|
| L-01 | 页面加载 | — |
| L-02 | 表单字段渲染 | email + password input |
| L-03 | 提交空表单 validation | HTML5 required 提示 |
| L-04 | axe 通过 | 0 critical + 0 serious |

---

## 4. 跑法

```bash
cd apps/web

# 首次 / 改 UI 后:打基线
pnpm test:e2e:update

# 回归(对比基线)
pnpm test:e2e

# 看 HTML 报告(失败时排查)
pnpm test:e2e:report

# 只跑一个 spec
pnpm exec playwright test tests/e2e/patterns.spec.ts
```

---

## 5. 已知限制 / 不覆盖

- **真文件上传**：generate 用 dummy file,不真触发后端生成
- **真 API 调用**：用 mock token,色号统计的**数字**不验证(只验证 modal UI 结构)
- **真 PDF 导出**：按钮存在性,不下单生成 PDF
- **性能 / Lighthouse**：单独跑 `tests/lighthouse.cjs`(已存在)
- **rate limit / DDoS**：安全测试另立
- **后端 API**：FastAPI 那边有 `tests/` 目录,独立 pytest 跑

---

## 6. 上线流程整合

```bash
# 完整 pre-deploy 链:
pnpm build:standalone         # 1. build web
pnpm test:e2e:update          # 2. 重新打基线(UI 改了才需要)
pnpm test:e2e                 # 3. 回归
# 全绿 → sudo pnpm restart:standalone
# 红了 → 不上线,看 report 修
```

或一条命令 `scripts/pre-deploy.sh`(待补):
```bash
#!/bin/sh
set -e
pnpm build:standalone && pnpm test:e2e && sudo pnpm restart:standalone
echo "✅ 回归通过 + 已重启,流量已切新代码"
```

---

## 7. Spec 文件组织

```
apps/web/tests/e2e/
├── TEST_CASES.md            ← 本文档
├── README.md                ← 工具使用
├── home.spec.ts             ← H-01..H-07
├── convert.spec.ts          ← G-01..G-07
├── patterns.spec.ts         ← P-01..P-11
├── pattern-detail.spec.ts   ← PD-01..PD-07
├── docs.spec.ts             ← D-01..D-05
├── login.spec.ts            ← L-01..L-04
├── helpers.ts               ← waitForImagesLoaded + axe helpers
└── */snapshots/             ← 视觉基线(自动生成)
```