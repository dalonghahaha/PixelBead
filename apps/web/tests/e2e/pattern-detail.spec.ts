/**
 * /patterns/[id] 详情页
 * 用例 PD-01..PD-07(见 TEST_CASES.md)
 *
 * mock token 后端不认,jwt 解码抛 "Not enough segments",页面渲染 ⚠️ 错误。
 */
import { test, expect } from '@playwright/test';
import {
  mockLogin,
  waitForImagesLoaded,
  installPageErrorListener,
  axeCriticalSerious,
} from './helpers';

const FAKE_ID = 'e2e-fake-pattern-id';

test.describe('Pattern detail page', () => {
  test('shows error state for non-existent pattern (PD-01/07)', async ({ context, page }) => {
    await mockLogin(context, page);
    const pageErrors = installPageErrorListener(page);

    await page.goto(`/patterns/${FAKE_ID}`, { waitUntil: 'domcontentloaded' });
    await waitForImagesLoaded(page);

    // 错误态:API 返 401/无效 token,页面 setError 后渲染 ⚠️ 红框
    // 错误信息可能含「无效 token」「图纸不存在」「加载失败」之一
    const errorText = page.getByText(
      /无效 token|图纸不存在|加载失败|加载图纸/,
    );
    await expect(errorText).toBeVisible({ timeout: 15_000 });

    const blocking = await axeCriticalSerious(page);
    if (blocking.length > 0) console.error('axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations on detail error').toEqual([]);

    // 没 page error 才算干净(API 4xx 不会触发 pageerror)
    expect(pageErrors, 'no uncaught JS errors on detail page').toEqual([]);
  });

  test('back-to-list link present (PD-07 partial)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto(`/patterns/${FAKE_ID}`, { waitUntil: 'domcontentloaded' });

    // Header nav 里永远有「我的图纸」链到 /patterns
    await expect(page.locator('a[href="/patterns"]').first()).toBeVisible({ timeout: 10_000 });
  });
});