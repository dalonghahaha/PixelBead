/**
 * 首页 — 视觉基线 + a11y 扫描
 * 路径: GET /
 * 期望: hero h1 "PixelBead" + 3 个 features
 * 用例: H-01..H-07(见 TEST_CASES.md)
 */
import { test, expect } from '@playwright/test';
import {
  waitForImagesLoaded,
  installPageErrorListener,
  axeCriticalSerious,
} from './helpers';

test.describe('Home page', () => {
  test('renders + passes axe + screenshot baseline (H-01/02/03)', async ({ page }) => {
    const pageErrors = installPageErrorListener(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // H-04 hero h1 可见
    await expect(page.getByRole('heading', { name: 'PixelBead', level: 1 })).toBeVisible();

    // 等所有图片加载完(logo / examples / og)
    await waitForImagesLoaded(page);

    // H-03 截图全页
    await expect(page).toHaveScreenshot('home-full.png', { fullPage: true });

    // H-02 axe(只阻断 critical/serious)
    const blocking = await axeCriticalSerious(page);
    if (blocking.length > 0) console.error('axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations on home page').toEqual([]);

    // H-01 无 uncaught JS error(放过 Next dev 自身 console.error/HMR 噪音)
    expect(pageErrors, 'no uncaught JS errors on home page').toEqual([]);
  });

  test('logo + footer links present (H-05/06/07)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForImagesLoaded(page);

    // H-05 logo
    const logo = page.locator('img[src="/favicon.svg"]').first();
    await expect(logo).toBeVisible();

    // H-07 footer 链到 /docs
    await expect(page.locator('footer a[href="/docs"]').first()).toBeVisible();
  });
});