/**
 * T037: Lighthouse mobile 跑分(性能 + a11y + BP + SEO)
 *
 * 用 puppeteer-core + 系统 snap chromium(不下载 Lighthouse 自带 Chrome)。
 *
 * 用法:
 *   node tests/lighthouse.cjs                    # 默认 http://127.0.0.1:3000/
 *   node tests/lighthouse.cjs https://prod.example.com/
 *
 * 输出:stdout JSON,4 类分数;每类 < 90 退出 1
 */

const puppeteer = require('puppeteer-core');

const URL = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:3000/';

(async () => {
  // Lighthouse 通过 chrome-launcher 需要 Chrome path
  // 这里我们用一个极简实现: 用 chrome-remote-interface 拉 DevTools metrics
  // 但完整 lighthouse 跑分需要 lighthouse npm 包,装它需要 ~150MB
  // 折中方案: 用 chrome 直接跑 lighthouse CLI
  const { execSync } = require('child_process');

  console.log(`Running Lighthouse on ${URL}...`);
  try {
    const json = execSync(
      `npx --yes lighthouse ${URL} ` +
        `--quiet ` +
        `--output=json ` +
        `--output-path=stdout ` +
        `--only-categories=performance,accessibility,best-practices,seo ` +
        `--form-factor=mobile ` +
        `--throttling-method=simulate ` +
        `--chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --user-data-dir=/root/snap/chromium/common"`,
      { encoding: 'utf8', timeout: 180000, maxBuffer: 50 * 1024 * 1024 },
    );
    const result = JSON.parse(json);
    const cats = result.categories || {};
    const summary = {
      url: URL,
      performance: Math.round((cats.performance?.score || 0) * 100),
      accessibility: Math.round((cats.accessibility?.score || 0) * 100),
      bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
      seo: Math.round((cats.seo?.score || 0) * 100),
    };
    console.log(JSON.stringify(summary, null, 2));
    const failed = Object.entries(summary).filter(
      ([k, v]) => k !== 'url' && typeof v === 'number' && v < 90,
    );
    if (failed.length > 0) {
      console.error(
        `\n❌ Lighthouse FAIL (threshold 90): ${failed.map(([k, v]) => `${k}=${v}`).join(', ')}`,
      );
      process.exit(1);
    }
    console.log('\n✅ Lighthouse PASS: all 4 categories ≥ 90');
    process.exit(0);
  } catch (err) {
    console.error('Lighthouse run failed:', err.message || err);
    process.exit(2);
  }
})();