# E2E Tests — Playwright + axe a11y

最小骨架，跑通首页 (`/`) + 转换页 (`/generate`) 两条路径。

## 跑

```bash
# 1. 生成/更新截图基线(改 UI 后必跑)
pnpm test:e2e:update

# 2. 跑测试(用基线做 diff,失败 = UI/代码变化了)
pnpm test:e2e

# 3. 看 HTML 报告(失败时)
pnpm test:e2e:report
```

## 配置

- `playwright.config.ts` 顶层文件
- **端口**：3100(避开 3000 上跑的 standalone production build)
- **浏览器**：系统 `/usr/bin/chromium-browser`,**不**下载 Playwright 自带 chromium(节省 ~200MB)
- **视口**：1280×720 desktop
- **容差**：2% 像素差异(`maxDiffPixelRatio: 0.02`)
- **axe 规则**：`wcag2a` + `wcag2aa`,**只阻断 critical + serious**

## 怎么扩

加一条 spec 到 `tests/e2e/`:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('登录页视觉 + a11y', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
  await expect(page).toHaveScreenshot('login-full.png', { fullPage: true });

  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
});
```

需要登录态时参考 `convert.spec.ts` 的 `addCookies` + `addInitScript` 模式。

## 常见坑

| 坑 | 解 |
|---|---|
| `waitUntil: 'networkidle'` 超时 | Next dev 有持续 HMR ws 永远不 idle。改 `domcontentloaded` + 显式 `expect(...).toBeVisible()` |
| 改了源码但截图没变 | 确认 baseURL 指向 dev server(`3100`),不是 standalone build(`3000`) |
| 截图差异过大 | 检查 UI 是不是真改了;小改动可以调 `maxDiffPixelRatio` 或 `--update-snapshots` |
| axe 报 nested-interactive | 拆分 — 触发按钮不要放在 `role="radio"` / `role="button"` 里 |