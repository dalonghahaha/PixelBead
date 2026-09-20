/**
 * T035: Playwright-compatible axe-core e2e 校验
 *
 * 用 puppeteer-core + 系统 snap chromium 跑 axe-core wcag2a/wcag2aa 检查。
 * 不引入 Playwright 自己的 chromium 下载(节省 200MB)。
 *
 * 用法:
 *   node tests/axe.cjs                          # 默认 http://127.0.0.1:3000/
 *   BASE_URL=https://staging.example.com node tests/axe.cjs
 *   node tests/axe.cjs http://127.0.0.1:3000/generate
 *
 * 输出:
 *   stdout JSON 列出 violations
 *   退出码 0 = 0 critical + 0 serious, 1 = 有违反
 */

const puppeteer = require('puppeteer-core');
const axeSource = require('axe-core').source;

const URL = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:3000/';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--user-data-dir=/root/snap/chromium/common',
    ],
    headless: 'new',
  });

  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
    // 注入 axe-core 源码
    await page.evaluate(axeSource);
    // 跑 axe,限定 wcag2a + wcag2aa
    const results = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        resultTypes: ['violations'],
      });
    });

    const violations = results.violations || [];
    const summary = {
      url: URL,
      violationCount: violations.length,
      byImpact: violations.reduce((acc, v) => {
        const i = v.impact || 'minor';
        acc[i] = (acc[i] || 0) + 1;
        return acc;
      }, {}),
      violations: violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodeCount: v.nodes.length,
        sampleNodes: v.nodes.slice(0, 3).map((n) => ({
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      })),
    };

    console.log(JSON.stringify(summary, null, 2));

    const critical = summary.byImpact.critical || 0;
    const serious = summary.byImpact.serious || 0;
    if (critical > 0 || serious > 0) {
      console.error(`\n❌ axe-core FAIL: ${critical} critical + ${serious} serious violations`);
      process.exit(1);
    } else {
      console.log(`\n✅ axe-core PASS: 0 critical + 0 serious`);
      process.exit(0);
    }
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('axe.cjs crashed:', err);
  process.exit(2);
});