/**
 * /login 登录页
 * 用例 L-01..L-04(见 TEST_CASES.md)
 */
import { test, expect } from '@playwright/test';
import { installPageErrorListener, axeCriticalSerious } from './helpers';

test.describe('Login page', () => {
  test('renders form + axe (L-01/02/04)', async ({ page }) => {
    const pageErrors = installPageErrorListener(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // 表单字段
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    // 提交按钮(取第一个 type=submit,避开"立即注册"等 navigation 按钮)
    await expect(
      page.locator('button[type="submit"]').first(),
    ).toBeVisible();

    // a11y
    const blocking = await axeCriticalSerious(page);
    if (blocking.length > 0) console.error('axe violations:', JSON.stringify(blocking, null, 2));
    expect(blocking, 'no critical/serious a11y violations on login').toEqual([]);
    expect(pageErrors, 'no uncaught JS errors on login').toEqual([]);
  });

  test('submit empty form triggers HTML5 required (L-03)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // 找到 submit 按钮并点
    await page.locator('button[type="submit"]').first().click();

    // HTML5 validation: 至少一个 invalid field
    const invalidCount = await page.locator(':invalid').count();
    expect(invalidCount, 'expected at least one invalid field after empty submit').toBeGreaterThan(0);
  });
});