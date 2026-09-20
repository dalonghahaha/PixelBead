# Data Model — Feature 004 Landing Page Polish

> 004 引入的新数据/对象很少。`User` 和 `Palette` 已分别在 002 和 003 定义,本 feature 复用即可。

## New entities

**None.**

004 不引入任何新的持久化实体或新数据库表。复用现有:

| Entity | Defined in | Used by 004 in |
|---|---|---|
| `User` | 002-user-auth | FR-2(Header 登录态) — 仅读 `id` + `email` + `avatarUrl`/`name` |
| `Palette` | 003-image-to-bead-pattern | FR-6(动态色板数) — 仅读 `/palettes` 端点的数组长度 |
| `Pattern` | 003-image-to-bead-pattern | (out of scope,仅作为后续 spec 锚点) |

## Transient / runtime-only objects

下面这些不是实体,只是 004 内部的渲染期数据结构。

### `HomePageProps`
Server Component `page.tsx` 的入参(隐式,Next.js 自动注入)。

| Field | Type | Source | Notes |
|---|---|---|---|
| (none — page.tsx takes no props) | — | — | RSC root |

### `HeaderProps`(新增,定义于 Header.tsx)

| Props | 类型 | 来源 | 用途 |
|---|---|---|---|
| `loggedIn` | `boolean` | layout.tsx 从 cookie 推导 | 控制显示 "登录" 按钮 vs 头像菜单 |
| `user` | `{ id: string; email: string; name?: string; avatarUrl?: string } \| null` | layout.tsx 从 session lookup | 头像菜单显示名 + 头像图 |
| `currentPath` | `string`(可选) | layout.tsx | 用于高亮当前页(本期不需要,先建 prop 方便后续) |

### `ExampleAssets`
静态打包的两张图,文件路径常量。

| Field | Type | Source | Notes |
|---|---|---|---|
| `originalJpg` | `/examples/original.jpg` | `apps/web/public/examples/` | FR-1 静态资源 |
| `patternPng` | `/examples/pattern.png` | `apps/web/public/examples/` | FR-1 静态资源 |

### `PaletteCountCache`
Next.js fetch cache ISR,key = `GET /palettes`,`revalidate = 3600`。

| Field | Type | Notes |
|---|---|---|
| `count` | `number` | 渲染时使用,fallback 文案 `20+ 种` 在 fetch 失败时生效 |

## State transitions

**None.** 004 不引入新的状态机。所有交互都是渲染期 prop 决定。

## Validation rules

- Header 的 `loggedIn` 必须严格 boolean(`true` / `false`),不允许 truthy 其他值
- `user` 在 `loggedIn=false` 时必须为 `null`,不允许 partial object
- `examplePattern.png` 必须存在,否则 `<img>` 加 `onError` fallback 隐藏

## Relationships

无新关系。所有数据访问是只读 GET(`/palettes` / cookie-derived user lookup)。