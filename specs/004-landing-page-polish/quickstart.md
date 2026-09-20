# Quickstart — Feature 004 Landing Page Polish

> 跑通 004 改造的端到端验证场景。本文件只描述**怎么验证 / 怎么跑通**,不写实现代码。

## Prerequisites

- 仓库根目录 `/data/github/PixelBead`
- Node.js ≥ 20(Next.js 14 要求)
- pnpm ≥ 8(workspace 管理)
- Python ≥ 3.10 + pypindou(本地预生成示例拼豆图用)
- Chromium(snap 或 apt)+ 中文字体(`fonts-wqy-microhei`)
- Playwright(`pnpm add -D @playwright/test`)+ `@axe-core/playwright`(本地 e2e 测试用)

## Setup

```bash
cd /data/github/PixelBead

# 1. 起 web + api
docker compose up -d postgres redis   # 或本地启动
cd apps/api && uvicorn main:app --reload --port 8000 &
cd ../web && pnpm dev &

# 2. 跑 004 的一次性资源生成(手工)
python3 apps/web/scripts/gen-example-pattern.py
#   输入: apps/web/public/examples/original.jpg
#   输出: apps/web/public/examples/pattern.png
# 期望: pattern.png 是 29×29 网格的真实拼豆图案,色板 MARD,与原图肉眼对应
```

## Module-by-module verification

### Module A — Static assets
```bash
ls -la apps/web/public/examples/original.jpg apps/web/public/examples/pattern.png
ls -la apps/web/public/favicon.svg apps/web/public/og.png
file apps/web/public/favicon.svg apps/web/public/og.png
# 期望: 都存在,og.png 是 1200×630 PNG,original.jpg ≤ 200KB,pattern.png ≤ 300KB
```

### Module B — page.tsx content
启动 dev server,浏览器打开 `http://localhost:3000/`:
- Hero 显示 "PixelBead" + "上传图片,3 秒生成拼豆图纸" + "开始生成 →"
- 三卖点(支持格式 / N 种真实拼豆色板 / 一键导出)中"N" 与 `curl localhost:8000/palettes | jq 'length'` 一致
- "示例效果"卡左右分别是真实照片 + 真实拼豆图纸
- 浏览器 DevTools → Elements → `<head>`:
  - `<title>` = "PixelBead — 上传图片,3 秒生成拼豆图纸"
  - `<meta property="og:title">` / `og:description` / `og:image` / `<meta name="twitter:card">` 全部存在且非空

### Module C — Header + CTA auth-aware
```bash
# 未登录态
curl -I http://localhost:3000/ | grep -i 'set-cookie' || echo 'no session cookie'
# 期望: 显示 "登录" 按钮,不显示头像
# 点击 "开始生成 →" → 跳到 /login?redirect=/generate

# 登录态
# 用 002 提供的登录流程拿到 session cookie,curl 加 --cookie:
curl --cookie "pixelbead_session=..." http://localhost:3000/ | grep -o 'avatar\|头像\|登录' | head -3
# 期望: 显示 "登录" 不出现,显示头像元素
# 点击 "开始生成 →" → 直接跳 /generate
```

### Module D — Footer
打开 `http://localhost:3000/`,滚到底:
- 桌面 ≥ 1024px:三段并排(logo+简介 / 链接列 / 版权)
- 平板 768px:三段两列堆叠
- 手机 < 768px:三段单列堆叠
- Footer 引用 favicon.svg 作为图标

### Module E — Mobile (375 / 414 / 768 / 1280)
```bash
# 用 snap chromium 截四档
mkdir -p /tmp/004-shots
for w in 375 414 768 1280; do
  /snap/bin/chromium --headless --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=${w},1200 \
    --user-data-dir=/root/snap/chromium/common \
    --screenshot=/tmp/004-shots/home-${w}.png \
    http://127.0.0.1:3000/ 2>&1 | grep 'bytes written'
done
ls -la /tmp/004-shots/
# 视觉检查:
# - 375px: Hero 单列、3 卖点单列、示例单列、Header 折叠为汉堡
# - 414px: 同 375,但更宽松
# - 768px: 3 卖点 3 列、示例左右并排
# - 1280px: 完整桌面布局
```

### Module F — Visual + accessibility validation
```bash
# Lighthouse mobile(阈值 ≥ 90 四项)
npx lighthouse http://127.0.0.1:3000/ \
  --preset=desktop --output=json --quiet \
  --chrome-flags='--headless --no-sandbox --disable-gpu' \
  | jq '.categories | to_entries | map({name: .key, score: (.value.score * 100 | floor)})'
# 期望: performance ≥ 90, accessibility ≥ 90, best-practices ≥ 90, seo ≥ 90

# axe-core(0 critical + 0 serious)
npx @axe-core/cli http://127.0.0.1:3000 --tags wcag2a,wcag2aa
# 期望: "0 violations"

# Playwright e2e(若有)
cd apps/web && pnpm exec playwright test tests/axe.spec.ts
```

### Module G — SNS share preview
- 打开 https://www.opengraph.xyz/ 或 https://www.facebook.com/sharing/debugger/
- 输入 `http://localhost:3000/`(或 `https://your-prod-domain/`)
- 期望预览卡片显示:标题 PixelBead、描述、og.png 缩略图、twitter:card = summary_large_image

## Acceptance summary

走完上面 6 个 module 的验证,**全过**就视为 004 完成。

回写 commit message:
```
feat(landing): landing page polish (FR-1 to FR-10)

- Replace mock example with real CC0 photo + pypindou-generated pattern
- Header auth-aware via Server Component cookie read
- CTA routes to /login?redirect=/generate for anon users
- Mobile responsive at 375/414/768/1280
- SEO metadata + og.png 1200x630
- Dynamic palette count from /palettes with 1h cache + fallback
- Footer: brand + links + copyright (3-col desktop, stacked mobile)
- Self-designed favicon.svg reused in Header + Footer
- a11y: heading hierarchy, alt text, focus-visible, WCAG AA contrast
- CTA hover/active/loading states

Visually verified via headless Chromium at 4 breakpoints.
Lighthouse mobile ≥ 90/90/90/90. axe-core 0 critical.
```

参考依据:`specs/004-landing-page-polish/spec.md` + `plan.md` + `tasks.md`。