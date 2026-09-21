import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 首页 — 视觉基线 + a11y 扫描
 * 路径: GET /
 * 期望: hero h1 "PixelBead" + 3 个 features
 */

/** 等所有 <img> 加载完成(naturalWidth > 0),避免头less 截到破图占位符 */
async function waitForImagesLoaded(page: import('@playwright/test').Page) {
  await page
    .waitForFunction(
      () =>
        Array.from(document.images).every(
          (img) => img.complete && img.naturalWidth > 0,
        ),
      null,
      { timeout: 10_000 },
    )
    .catch(() => {
      /* 部分图片可能故意失败(如占位),不阻断 */
    });
}

test.describe('Home page', () => {
  test('renders + passes axe + screenshot baseline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 等核心元素出现,确保截图稳定
    await expect(page.getByRole('heading', { name: 'PixelBead', level: 1 })).toBeVisible();

    // 等所有图片加载完(logo / examples / og),否则头less 截到破图占位符
    await waitForImagesLoaded(page);

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