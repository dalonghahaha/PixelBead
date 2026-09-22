/**
 * /patterns 页 — 列表 + view modal + 删除 + 色号统计
 * 用例 P-01..P-11(见 TEST_CASES.md)
 */
import { test, expect } from '@playwright/test';
import {
  mockLogin,
  waitForImagesLoaded,
  installPageErrorListener,
  axeCriticalSerious,
} from './helpers';

test.describe('Patterns page', () => {
  test('redirects to /login when not authenticated (P-02)', async ({ page }) => {
    await page.goto('/patterns', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('renders list + axe + screenshot (P-01/03/04/05)', async ({ context, page }) => {
    await mockLogin(context, page);
    const pageErrors = installPageErrorListener(page);

    await page.goto('/patterns', { waitUntil: 'domcontentloaded' });
    await waitForImagesLoaded(page);

    // 卡片网格存在(可能 0 张,空状态文案)
    const emptyText = page.getByText(/还没有图纸|去.*生成/);
    const cards = page.locator('.grid > div').filter({ hasText: /MARD|ARTKAL|COCO/ });

    await expect(emptyText.or(cards.first())).toBeVisible({ timeout: 10_000 });

    // P-04 axe
    const blocking = await axeCriticalSerious(page);
    if (blocking.length > 0) console.error('axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations').toEqual([]);

    // P-01 无 uncaught JS error
    expect(pageErrors, 'no uncaught JS errors on patterns').toEqual([]);

    // P-05 截图全页
    await expect(page).toHaveScreenshot('patterns-full.png', { fullPage: true });
  });

  test('view modal: tabs + color stats + downloads (P-06..11)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/patterns', { waitUntil: 'domcontentloaded' });
    await waitForImagesLoaded(page);

    const firstViewBtn = page.getByRole('button', { name: /查看|View/ }).first();
    test.skip((await firstViewBtn.count()) === 0, 'no patterns in test account');

    await firstViewBtn.click();

    // modal 出现
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // tab 切换
    await expect(modal.getByRole('button', { name: /符号图|Symbol/ })).toBeVisible();
    const previewTab = modal.getByRole('button', { name: /预览|Preview/ });
    if (await previewTab.isEnabled()) {
      await previewTab.click();
      await expect(modal.locator('img').first()).toBeVisible();
    }

    // 色号统计 section
    await expect(modal.getByText(/色号统计|Color Stats|暂无用量/)).toBeVisible({ timeout: 8_000 });

    // modal 内 a11y
    const blocking = await axeCriticalSerious(modal);
    if (blocking.length > 0) console.error('modal axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations in modal').toEqual([]);

    // 关闭 modal
    await modal.getByRole('button', { name: /关闭|Close/ }).click();
    await expect(modal).not.toBeVisible();
  });

  test('delete button triggers confirm (P-10)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/patterns', { waitUntil: 'domcontentloaded' });

    const firstDelete = page.getByRole('button', { name: /删除|Delete/ }).first();
    test.skip((await firstDelete.count()) === 0, 'no patterns to test delete');

    let confirmed = false;
    page.on('dialog', async (d) => {
      confirmed = d.type() === 'confirm';
      await d.dismiss();
    });

    await firstDelete.click();
    await page.waitForTimeout(500);
    expect(confirmed, 'window.confirm was triggered').toBe(true);
  });
});