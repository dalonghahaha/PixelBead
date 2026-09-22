/**
 * Dark mode 表单控件 — input/select/textarea 不能闪白
 *
 * Bug 背景:之前只靠 Tailwind `dark:` 工具类,需要每个控件手写,
 * 漏一个就闪白。本次改 globals.css 全局 CSS 变量 + 规则,所有
 * form 控件自动跟随 dark 模式。
 *
 * 用 page.emulateMedia({ colorScheme: 'dark' }) 强制 media query,
 * 比 addInitScript 加 html.dark class 更稳(后者有时序问题)。
 *
 * 用例: DM-01..DM-04
 */
import { test, expect } from '@playwright/test';
import { mockLogin } from './helpers';

test.describe('Dark mode form controls', () => {
  test.use({ colorScheme: 'dark' });

  test('login form: input bg NOT white in dark mode (DM-01/02)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // 等 hydrate 完成
    await expect(page.locator('input[type="email"]').first()).toBeVisible({
      timeout: 10_000,
    });

    const inputs = page.locator('input[type="email"], input[type="password"]');
    const count = await inputs.count();
    expect(count, 'expected at least one input').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const bg = await inputs.nth(i).evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      // white = rgb(255, 255, 255), dark gray-800 = rgb(31, 41, 55)
      expect(
        bg,
        `input[${i}] bg should NOT be white in dark mode (got ${bg})`,
      ).not.toBe('rgb(255, 255, 255)');
    }
  });

  test('generate form: select + input bg NOT white in dark mode (DM-03/04)', async ({
    context,
    page,
  }) => {
    await mockLogin(context, page);
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });

    // 等 h1 + palette select 加载
    await expect(page.getByRole('heading', { name: '上传图片 → 拼豆图纸' })).toBeVisible({
      timeout: 15_000,
    });

    const fields = page.locator('select, input[type="number"], input[type="text"]');
    const count = await fields.count();
    expect(count, 'expected at least one form field').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const tag = await fields.nth(i).evaluate((el) => el.tagName);
      const bg = await fields.nth(i).evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      expect(
        bg,
        `${tag}[${i}] bg should NOT be white in dark mode (got ${bg})`,
      ).not.toBe('rgb(255, 255, 255)');
    }
  });
});