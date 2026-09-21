import { defineConfig, devices } from '@playwright/test';

/**
 * 最小骨架 E2E 配置
 * - 用系统 /usr/bin/chromium-browser,不下载 Playwright 自带 chromium(节省 ~200MB)
 * - 自起 dev server,baseURL = http://127.0.0.1:3000
 * - 只跑 Chromium,desktop viewport 1280x720
 * - 截图基线放 tests/e2e/snapshots/,pixelRatio 0.02 容差
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // 最小骨架先串行,后续再并行
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report' }]],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02, // 2% 像素差异容差
      animations: 'disabled',
      caret: 'hide',
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 720 },
    // 用系统 chromium,避开 Playwright 自带 chromium 下载
    launchOptions: {
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 自动起 dev server;已在跑则复用
  // 用 3100 避开 3000 上可能跑的 standalone production build
  webServer: {
    command: 'npx next dev -p 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});