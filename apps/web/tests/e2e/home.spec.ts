import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 首页 — 视觉基线 + a11y 扫描
 * 路径: GET /
 * 期望: hero h1 "PixelBead" + 3 个 features
 */
test.describe('Home page', () => {
  test('renders + passes axe + screenshot baseline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 等核心元素出现,确保截图稳定
    await expect(page.getByRole('heading', { name: 'PixelBead', level: 1 })).toBeVisible();

    // 给动态色板数 + og 图一点时间(SSR 一次 fetch + 图片懒加载)
    await page.waitForLoadState('domcontentloaded');

    // 截图全页 — 视觉基线
    await expect(page).toHaveScreenshot('home-full.png', {
      fullPage: true,
    });

    // axe-core a11y 扫描(WCAG 2.0 A + AA)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // 只阻断 critical/serious,moderate/minor 警告不阻断
    const blocking = results.violations.filter((v) =>
      v.impact === 'critical' || v.impact === 'serious',
    );

    if (blocking.length > 0) {
      console.error('axe violations:', JSON.stringify(blocking, null, 2));
    }
    expect(blocking, 'no critical/serious a11y violations on home page').toEqual([]);
  });
});