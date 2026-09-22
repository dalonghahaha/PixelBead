/**
 * 转换页 — 视觉基线 + a11y 扫描
 * 路径: GET /generate
 * 守卫: useAuth() 需要 token + user
 * 用例: G-01..G-07(见 TEST_CASES.md)
 */
import { test, expect } from '@playwright/test';
import {
  waitForImagesLoaded,
  installPageErrorListener,
  mockLogin,
  axeCriticalSerious,
} from './helpers';

test.describe('Convert page', () => {
  test('renders form when logged in + axe + screenshot (G-01/02/03/05/06/07)', async ({
    context,
    page,
  }) => {
    const pageErrors = installPageErrorListener(page);
    await mockLogin(context, page);

    await page.goto('/generate', { waitUntil: 'domcontentloaded' });

    // 等表单 h1
    await expect(page.getByRole('heading', { name: '上传图片 → 拼豆图纸' })).toBeVisible({
      timeout: 15_000,
    });

    // 等所有图片加载完
    await waitForImagesLoaded(page);

    // 等色板列表请求完成(可能后端没起,不强制)
    await page
      .waitForResponse(
        (resp) => resp.url().includes('/palettes') && resp.status() < 500,
        { timeout: 10_000 },
      )
      .catch(() => {});

    // G-07 palette select 有 option
    await expect(page.locator('#gen-palette')).toBeVisible();

    // G-06 所有 label/input 配对 — 检查 7 个控件 id 都在
    for (const id of [
      'gen-file-input',
      'gen-palette',
      'gen-width',
      'gen-height',
      'gen-max-colors',
      'gen-prefilter',
      'gen-cleanup',
    ]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    // G-03 截图全页
    await expect(page).toHaveScreenshot('convert-full.png', { fullPage: true });

    // G-02 axe
    const blocking = await axeCriticalSerious(page);
    if (blocking.length > 0) console.error('axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations on convert page').toEqual([]);

    // G-01 无 uncaught JS error
    expect(pageErrors, 'no uncaught JS errors on convert page').toEqual([]);
  });

  test('redirects to /login when not authenticated (G-04)', async ({ page }) => {
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});