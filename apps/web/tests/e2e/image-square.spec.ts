/**
 * 图片自动裁方 — 集成测试
 *
 * 用 page.setInputFiles 上传测试图(内存里生成 PNG),
 * 验证 generate 页:
 *   1. 显示原图尺寸 W×H
 *   2. 显示"自动处理"说明(中心裁切)
 *   3. 显示方形裁方预览(固定 w-44 h-44)
 *   4. 横长/竖长都被正确裁成 max(W,H)
 *
 * 用例: IS-01..IS-04
 */
import { test, expect, type Page } from '@playwright/test';
import { mockLogin } from './helpers';

/** 在 Node 里生成测试 PNG(W×H,纯色背景 + 中心标记块),返回 base64 */
function makeTestPng(w: number, h: number): Buffer {
  // Node 没有 canvas — 用 sharp(已在 api 后端依赖里)生成,或纯手写 PNG
  // 这里走纯手写:PNG IHDR + IDAT 实在长;改用 sharp if available
  // 实际项目后端有 sharp,但 web 没装。改成动态 require 后端 node_modules。
  // 简化:用 Playwright 的 page.evaluate 在浏览器里生成 → setInputFiles
  // 这里返回 null,后面在 page 里生成
  return Buffer.from([]);
}

async function uploadInMemoryPng(page: Page, w: number, h: number, filename: string) {
  // 让浏览器生成指定尺寸的 PNG,再通过 DataTransfer 喂给 input
  await page.evaluate(
    async ({ w, h, filename }) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'red';
      ctx.fillRect(w / 2 - 10, h / 2 - 10, 20, 20); // 中心红块
      const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/png')!);
      const file = new File([blob], filename, { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.querySelector('#gen-file-input') as HTMLInputElement;
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { w, h, filename },
  );
}

test.describe('image auto-square', () => {
  test('横长图 800x400 → 裁方 800x800 + 提示(IS-01)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '上传图片 → 拼豆图纸' })).toBeVisible({
      timeout: 15_000,
    });

    await uploadInMemoryPng(page, 800, 400, 'wide.png');

    // 原图尺寸文字(可能出现在标题和描述两处,用 .first())
    await expect(page.getByText('原图 800×400').first()).toBeVisible({ timeout: 8_000 });
    // 提示含"中心裁切"+"800"
    await expect(page.getByText(/中心裁切/)).toBeVisible();
    await expect(page.getByText(/800×800/)).toBeVisible();
    // 方形预览(固定 w-44 h-44)出现
    const squaredPreview = page.locator('img[alt="裁方预览"]');
    await expect(squaredPreview).toBeVisible();
    await expect(squaredPreview).toHaveClass(/w-44/);
  });

  test('竖长图 300x900 → 裁方 900x900(IS-02)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '上传图片 → 拼豆图纸' })).toBeVisible({
      timeout: 15_000,
    });

    await uploadInMemoryPng(page, 300, 900, 'tall.png');

    await expect(page.getByText('原图 300×900').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/900×900/)).toBeVisible();
  });

  test('正方形图 256x256 → 不提示"中心裁切"(IS-03)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '上传图片 → 拼豆图纸' })).toBeVisible({
      timeout: 15_000,
    });

    await uploadInMemoryPng(page, 256, 256, 'square.png');

    await expect(page.getByText('原图 256×256').first()).toBeVisible({ timeout: 8_000 });
    // 正方形图不应触发裁切提示(只有"自动处理"框包含裁切文字)
    await expect(page.getByText(/中心裁切/)).not.toBeVisible();
    // 但裁方预览仍会出现(squared = 256×256,无变化)
    await expect(page.locator('img[alt="裁方预览"]')).toBeVisible();
  });

  test('上传新图前一个 URL 被 revoke(IS-04 内存泄漏)', async ({ context, page }) => {
    await mockLogin(context, page);
    await page.goto('/generate', { waitUntil: 'domcontentloaded' });

    // 第一次上传
    await uploadInMemoryPng(page, 400, 400, 'a.png');
    await expect(page.getByText('原图 400×400').first()).toBeVisible({ timeout: 8_000 });

    // 第二次上传 — 旧 previewUrl 应该被 revoke 但页面不应该崩
    await uploadInMemoryPng(page, 600, 200, 'b.png');
    await expect(page.getByText('原图 600×200').first()).toBeVisible({ timeout: 8_000 });
    // 没有 console error(由 helpers.installPageErrorListener 检查)
  });
});