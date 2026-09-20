# Contracts — Feature 004 Landing Page Polish

> 004 用到的接口契约。复用现有 API,本 feature 不新增 endpoint。

## External API contracts (consumed, not created)

### GET /palettes
- **Source**: 003-image-to-bead-pattern
- **Used by**: FR-6(dynamic palette count)
- **Caller**: Server Component `apps/web/app/page.tsx` via `fetch(..., { next: { revalidate: 3600 } })`
- **Response contract**:
  ```json
  {
    "palettes": [
      { "id": "MARD-S", "brand": "MARD", "color_count": 47, "...": "..." },
      { "id": "Artkal-S", "brand": "Artkal", "color_count": 45, "...": "..." }
    ]
  }
  ```
  (or an array directly, depending on 003's actual shape — to be confirmed in tasks phase)
- **Consumed as**: `response.palettes.length` (or `response.length`) → rendered as `"N 种真实拼豆色板"`
- **Failure mode**: fetch throws OR response.ok !== true → render fallback `"20+ 种真实拼豆色板"`; do not throw, do not block render.

### Session cookie (002-user-auth)
- **Source**: 002-user-auth
- **Used by**: FR-2 + FR-3 (Header auth state + CTA routing)
- **Caller**: Server Component `apps/web/app/layout.tsx` via `next/headers.cookies()`
- **Contract**: assumed to be HTTP-only cookie named `pixelbead_session` (or whatever 002 names it — to be confirmed in tasks phase)
- **Lookup**: layout calls existing session-decoder function (defined in 002) → returns `{ id, email, name?, avatarUrl? } | null`
- **Failure mode**: cookie missing / expired / decode fails → `loggedIn = false`, `user = null`

## Internal UI contracts (within web app)

### `<Header loggedIn user />` component prop contract
See `data-model.md → HeaderProps`.

### CTA `<Link href>` contract
- `loggedIn === true` → `href="/generate"`
- `loggedIn === false` → `href="/login?redirect=/generate"`

### `<img alt>` contract (FR-9)
- `original.jpg`: `alt="拼豆图案示例:一只卡通小狗"`
- `pattern.png`: `alt="对应的小狗拼豆图纸,29×29 网格,MARD 色板"`
- `favicon.svg` (in `<link rel="icon">`): no alt needed (not an `<img>`)
- `og.png` (in `<meta property="og:image">`): no alt (not an `<img>`)

## Files & directories contract (new in 004)

| Path | Purpose | Owner |
|---|---|---|
| `apps/web/public/examples/original.jpg` | 示例原图(老孙挑的 CC0 照片) | 004 Module A |
| `apps/web/public/examples/pattern.png` | 对应的拼豆图纸(本地脚本生成) | 004 Module A |
| `apps/web/public/favicon.svg` | 自设计 logo SVG | 004 Module A |
| `apps/web/public/og.png` | SNS 分享卡片图(1200×630) | 004 Module A |
| `apps/web/scripts/gen-example-pattern.py` | 一次性脚本(可保留) | 004 Module A |
| `apps/web/components/Header.tsx` | 改写感知登录态 + 移动端汉堡 | 004 Module C |
| `apps/web/components/Header.UserMenu.tsx` | 头像下拉菜单(client 子组件) | 004 Module C |
| `apps/web/components/Footer.tsx` | 重写三段 + 移动端堆叠 | 004 Module D |
| `apps/web/app/page.tsx` | 改写:示例图、色板数动态拉、SEO meta、CTA 路由、a11y | 004 Module B |
| `apps/web/app/layout.tsx` | 加 session 读 cookie → 给 Header 传 prop | 004 Module C |
| `apps/web/tailwind.config.ts` | 可能微调 mobile breakpoint(若 Tailwind 默认不够) | 004 Module E |
| `apps/web/tests/axe.spec.ts`(新) | Playwright + axe-core e2e | 004 Module F |

## Versioning

无。本 feature 不引入新 API,只消费现有 endpoint + 改变前端 UI。