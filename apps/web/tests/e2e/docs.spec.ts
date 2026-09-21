/**
 * /docs 使用文档页
 * 用例 D-01..D-05(见 TEST_CASES.md)
 */
import { test, expect } from '@playwright/test';
import {
  waitForImagesLoaded,
  installPageErrorListener,
  axeCriticalSerious,
} from './helpers';

test.describe('Docs page', () => {
  test('renders 5 sections + axe + screenshot (D-01/02/04/05)', async ({ page }) => {
    const pageErrors = installPageErrorListener(page);
    await page.goto('/docs', { waitUntil: 'domcontentloaded' });
    await waitForImagesLoaded(page);

    // D-02 5 个 section id 都在
    for (const id of ['quickstart', 'params', 'board-size', 'download', 'faq']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    // D-04 axe
    const blocking = await axeCriticalSerious(page);
    if (blocking.length > 0) console.error('axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations on docs').toEqual([]);

    // D-05 截图全页
    await expect(page).toHaveScreenshot('docs-full.png', { fullPage: true });

    // D-01 无 uncaught JS error
    expect(pageErrors, 'no uncaught JS errors on docs').toEqual([]);
  });

  test('TOC anchor links update URL hash (D-03)', async ({ page }) => {
    await page.goto('/docs', { waitUntil: 'domcontentloaded' });
    await waitForImagesLoaded(page);

    // 精确定位 docs 页的 TOC nav(避开 Header 的 nav)
    // TOC <nav> 内含 "目录" / "Contents" 标题,用文本反查
    const tocNav = page.locator('nav').filter({ hasText: /目录|Contents/ });
    await expect(tocNav).toBeVisible();

    const tocLink = tocNav.locator('a').first();
    await expect(tocLink).toBeVisible();

    // 取链接 href 的 hash 部分,点击后断言 URL 完全等于 (path + hash)
    const hash = (await tocLink.getAttribute('href')) || '';
    expect(hash, 'TOC link should have hash href').toMatch(/^#/);
    await tocLink.click();
    await expect(page).toHaveURL(new RegExp(`${hash.replace('#', '#')}$`), {
      timeout: 5_000,
    });
  });
});