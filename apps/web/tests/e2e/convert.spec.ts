import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** 等所有 <img> 加载完成,避免头less 截到破图占位符 */
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

/**
 * 转换页 — 视觉基线 + a11y 扫描
 * 路径: GET /generate
 * 守卫: useAuth() 需要 token + user (来自 localStorage + cookie 镜像)
 *
 * 注入方式: addInitScript 注入 localStorage;context.addCookies 注入 cookie
 *   这样 useAuth 同步读取到的 isLoggedIn=true,直接进表单,不被 /login 重定向
 */
test.describe('Convert page', () => {
  test('renders generate form when logged in + passes axe + screenshot baseline', async ({
    context,
    page,
  }) => {
    // 1. 注入 auth cookie(Server Component SSR 读这个)
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

    // 2. 注入 localStorage(useAuth client 端读这个)
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

    // 3. 直接访问 /generate,不被守卫重定向
    // 不能等 networkidle,Next dev 有持续 HMR ws 永远不 idle;用 domcontentloaded + 显式等元素
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });

    // 等 client-side useAuth 水合完 + 守卫放行 + 表单出现
    await expect(page.getByRole('heading', { name: '上传图片 → 拼豆图纸' })).toBeVisible({ timeout: 15_000 });

    // 等所有图片加载完(logo / examples / og / 用户头像),避免头less 截到破图占位符
    await waitForImagesLoaded(page);

    // 等色板列表请求完成(api.palettes() 在 useEffect 里跑)
    await page.waitForResponse(
      (resp) => resp.url().includes('/palettes') && resp.status() < 500,
      { timeout: 10_000 },
    ).catch(() => {
      // 后端可能没起,不强制等 — 截图照样能打
    });

    // 截图全页
    await expect(page).toHaveScreenshot('convert-full.png', {
      fullPage: true,
    });

    // axe a11y
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = results.violations.filter((v) =>
      v.impact === 'critical' || v.impact === 'serious',
    );

    if (blocking.length > 0) {
      console.error('axe violations on /generate:', JSON.stringify(blocking, null, 2));
    }
    expect(blocking, 'no critical/serious a11y violations on convert page').toEqual([]);
  });

  /**
   * 未登录访问 /generate → 应被守卫重定向到 /login
   * 这条只验证守卫行为,不打截图(登录页留到后续 spec)
   */
  test('redirects to /login when not authenticated', async ({ page }) => {
    // 不能等 networkidle,Next dev 有持续 HMR ws;domcontentloaded 后立即断言 URL 即可
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});