/**
 * 共享 helpers — Playwright e2e
 */
import type { Page, BrowserContext } from '@playwright/test';

/** 等所有 <img> 加载完成(naturalWidth > 0),避免头less 截到破图占位符 */
export async function waitForImagesLoaded(page: Page) {
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

/** mock 已登录态 — 注入 cookie + localStorage */
export async function mockLogin(context: BrowserContext, page: Page) {
  await context.addCookies([
    {
      name: 'pixelbead_token',
      value: 'e2e-mock-token',
      domain: '127.0.0.1',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
  await page.addInitScript(() => {
    localStorage.setItem('pixelbead_token', 'e2e-mock-token');
    localStorage.setItem(
      'pixelbead_user',
      JSON.stringify({
        id: 'e2e-user',
        email: 'e2e@test.local',
        username: 'e2e',
      }),
    );
  });
}

/**
 * 只监听 uncaught JS error(放弃 console.* 噪音):
 * - Next dev 的 HMR / dev overlay / source-map / 内置 next-dev-instrumentation
 *   会刷很多 console.error,跟被测代码无关。
 * - pageerror 是真正未捕获的运行时异常,值得断言。
 */
export function installPageErrorListener(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** 等待 axe 跑完,返回 critical+serious 列表(空数组 = 通过) */
export async function axeCriticalSerious(
  page: Page,
  tags: string[] = ['wcag2a', 'wcag2aa'],
) {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  return results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
}