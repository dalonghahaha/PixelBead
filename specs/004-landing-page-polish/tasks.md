# Tasks — Feature 004 Landing Page Polish

> Generated from `plan.md` + `spec.md` + `research.md` + `data-model.md` + `contracts/README.md` + `quickstart.md`.
> 按 spec-kit tasks skill 强制要求,**任务按 user story 组织**(P1/P2/P3/P4 + Polish)。
> 每个 task 30-90 分钟内可完成 + 可独立验收。

## Total task count

**40 tasks** across 7 phases.

| Phase | Tasks | Count |
|---|---|---|
| Phase 1: Setup | T001–T005 | 5 |
| Phase 2: Foundational (Module A — 静态资源) | T006–T011 | 6 |
| Phase 3: User Story 1 (P1 — Scenario 1 未登录访客) | T012–T015 | 4 |
| Phase 4: User Story 2 (P2 — Scenario 2 登录用户) | T016–T019 | 4 |
| Phase 5: User Story 3 (P3 — Scenario 3 移动端) | T020–T024 | 5 |
| Phase 6: User Story 4 (P4 — Scenario 4 分享) | T025–T027 | 3 |
| Final Phase: Polish & Cross-cutting | T028–T040 | 13 |

**Parallel opportunities**:15 `[P]` tasks(different files, no cross-deps)。
**Independent test criteria**: 每个 user story phase 都有独立"如何验证"。

## Dependencies (story completion order)

```
Phase 1: Setup (T001-T005)
  └─► Phase 2: Foundational / Module A (T006-T011)
        ├─► Phase 3: User Story 1 / Scenario 1 / P1 (T012-T015)
        │     │
        │     ├─► Phase 4: User Story 2 / Scenario 2 / P2 (T016-T019)
        │     │     │
        │     │     ├─► Phase 5: User Story 3 / Scenario 3 / P3 (T020-T024)
        │     │     │
        │     │     └─► Phase 6: User Story 4 / Scenario 4 / P4 (T025-T027)
        │     │
        │     └─► Final Phase: Polish & Cross-cutting (T028-T040)
        │
        └─► Final Phase (FR-7 Footer 部分独立,见 T033-T034)
```

## Implementation strategy: MVP first

**MVP = Phase 1 + Phase 2 + Phase 3 (P1)** = 15 tasks。
这是"未登录访客首次到达首页"的最小可用版本。

完成后,未登录访客已经能:
- 看到 Hero + 真实示例图 + 动态色板数 + SEO meta
- 点 CTA → /login?redirect=/generate

再依次加 P2 / P3 / P4 / Polish。

---

## Phase 1: Setup (verify environment, no code change)

> 验证所有 R1-R7 风险的缓解前提已就位。

- [ ] T001 Verify pypindou installed: `python3 -c "import pypindou; print(pypindou.__version__)"` — must succeed(R3 缓解)
- [ ] T002 Probe `apps/api/` for session cookie name + decoder function location(R1 缓解) — look at 002-user-auth 实现,把 cookie 名 + decoder 路径记下来(可能叫 `pixelbead_session` 或 `auth_token`,decoder 可能叫 `get_current_user` / `decode_session`)
- [ ] T003 Verify `GET /palettes` response shape(R2 缓解) — `curl -s http://127.0.0.1:8000/palettes | head -50`,记下是直接数组还是 `{ palettes: [] }` 包装
- [ ] T004 Verify snap chromium writable path: `/snap/bin/chromium --headless --no-sandbox --user-data-dir=/root/snap/chromium/common --screenshot=/root/snap/chromium/common/probe.png http://127.0.0.1:3000/` — must write 35696+ byte file(R4 缓解)
- [ ] T005 Verify wqy-microhei: `fc-list :lang=zh | wc -l` — must return ≥ 2(R4 缓解,字体已装但确认仍然生效)

## Phase 2: Foundational — Module A (静态资源)

> 所有"图片类"资源 ready。无 story label,因为是 Module A 公共基础。

- [ ] T006 [P] Pick CC0 photo from Unsplash, download to `apps/web/public/examples/original.jpg`, target ≤ 200KB, single subject (corgi / donut / cartoon) (FR-1, research.md Decision 1)
- [ ] T007 [P] Create `apps/web/scripts/gen-example-pattern.py` — calls `pypindou.image_to_pattern(original_path, grid=29, palette="MARD", dithering=True)`, writes PNG to `apps/web/public/examples/pattern.png` (FR-1, research.md Decision 2)
- [ ] T008 [P] Run `python3 apps/web/scripts/gen-example-pattern.py` — verify `pattern.png` exists, ≤ 300KB, `file` reports PNG
- [ ] T009 [P] Hand-author `apps/web/public/favicon.svg` — 8×8 pixel bead grid, 3-4 colors, forms stylized "P" (FR-8, research.md Decision 5)
- [ ] T010 [P] Create `apps/web/public/og.png` (1200×630, ≤ 200KB) — reuse `pattern.png` resized, or pick representative bead grid (FR-5, research.md Decision 7)
- [ ] T011 [P] Create `apps/web/public/examples/` directory, place all 4 assets + verify with `ls -la` + `file`

## Phase 3: User Story 1 — Scenario 1 / P1(未登录访客首次到达)

**Story goal**: 未登录访客从任意入口到达首页,5 秒内明白产品价值,点 CTA 被引导到登录。

**Independent test criteria**:
- `curl http://127.0.0.1:3000/` 返回 HTML 含 Hero + 真实示例图 + 动态色板数(数字与 `curl /palettes | jq length` 一致)
- 未登录态(无 cookie)点 CTA → 跳 `/login?redirect=/generate`
- `<title>` 含 "PixelBead"
- 视觉截图:示例卡左右是真实图,不再是 mock

- [ ] T012 [US1] Rewrite `apps/web/app/page.tsx`: replace CSS gradient mock with `<img src="/examples/original.jpg" alt="拼豆图案示例:卡通小狗" />` + `<img src="/examples/pattern.png" alt="对应的拼豆图纸,29×29 网格,MARD 色板" />` (FR-1)
- [ ] T013 [P] [US1] In `apps/web/app/page.tsx`: add dynamic palette count — `const palettes = await fetch(API_URL + '/palettes', { next: { revalidate: 3600 } }).then(r => r.json()).catch(() => null)` — parse to length (handle both array direct and `{ palettes: [] }` shape per T003), render `"N 种真实拼豆色板"`, fallback `"20+ 种真实拼豆色板"` on failure (FR-6, research.md Decision 4)
- [ ] T014 [US1] In `apps/web/app/page.tsx`: rewrite Hero CTA — accept `loggedIn` prop from layout (will be wired in Phase 4), render `<Link href={loggedIn ? "/generate" : "/login?redirect=/generate"}>` (FR-3)
- [ ] T015 [US1] **Verify Scenario 1**: with no session cookie, visit `/`, screenshot via snap chromium, manually confirm: real example images visible + palette count matches `/palettes` length + CTA href is `/login?redirect=/generate` + `<title>` contains "PixelBead"

**Parallel opportunities**: T013 `[P]` (palette count) is independent of T012 (image replacement). Both touch `page.tsx` but on different lines — sequential is fine, `[P]` indicates no upstream-blocker.

## Phase 4: User Story 2 — Scenario 2 / P2(登录用户到达)

**Story goal**: 已登录用户回到首页看到头像菜单,点 CTA 直接到 /generate,不再去登录页。

**Independent test criteria**:
- With valid session cookie, `curl http://127.0.0.1:3000/` 返回 HTML 含头像元素,不含 "登录" 按钮
- 已登录态点 CTA → 直接跳 `/generate`
- 头像点击 → 下拉菜单可见,含"我的图纸"、"退出登录"

- [ ] T016 [US2] Rewrite `apps/web/app/layout.tsx` (Server Component): import `cookies` from `next/headers`, read session cookie (name per T002 finding), call decoder function (per T002 finding), produce `{ loggedIn: boolean, user: { id, email, name?, avatarUrl? } | null }`, pass to `<Header />`
- [ ] T017 [US2] Rewrite `apps/web/components/Header.tsx` (Server parent): accept `loggedIn` + `user` props, render conditional: if loggedIn → avatar (or initial circle) + render `<UserMenu user={user} />` client child; if !loggedIn → "登录" button (linking `/login`); include desktop nav links (生成图纸 / 我的图纸)
- [ ] T018 [P] [US2] Create `apps/web/components/Header.UserMenu.tsx` (`'use client'`): accepts `user` prop, renders avatar button + dropdown with "我的图纸" / "退出登录" links, handles open/close with useState + click-outside
- [ ] T019 [US2] **Verify Scenario 2**: with a valid session cookie (curl `--cookie "..."`), fetch `/` and grep for avatar element + check CTA href is `/generate`; manually click in browser to verify dropdown opens (FR-2)

**Parallel opportunities**: T017 (Header parent) and T018 (UserMenu client) are independent — T018 can be written in parallel with T017 as long as both follow the props contract in `data-model.md → HeaderProps`. T016 (layout.tsx) MUST be done first because both T017 and T018 depend on the prop shape it produces.

## Phase 5: User Story 3 — Scenario 3 / P3(移动端访客)

**Story goal**: 移动端用户在 375 / 414 / 768px 三档下能看清、能点击、能完成"看 Hero → 点 CTA"全流程。

**Independent test criteria**:
- snap chromium 截 375 / 414 / 768 / 1280 四档宽度,视觉上无水平滚动
- CTA + Header 链接命中区域 ≥ 44×44px(用 DevTools 测或靠 Tailwind padding 推断)
- 移动端字体最小 16px

- [ ] T020 [US3] In `apps/web/app/page.tsx`: change Hero h1 from `text-5xl md:text-6xl` → `text-3xl sm:text-5xl md:text-6xl` (FR-4, research.md Decision 6)
- [ ] T021 [US3] In `apps/web/app/page.tsx`: change 3-feature grid from `grid md:grid-cols-3` → `grid sm:grid-cols-2 md:grid-cols-3` (FR-4)
- [ ] T022 [US3] In `apps/web/app/page.tsx`: change example card container from `grid md:grid-cols-2` → `grid sm:grid-cols-1 md:grid-cols-2` (FR-4)
- [ ] T023 [US3] In `apps/web/components/Header.tsx`: add mobile hamburger button (`md:hidden`), toggle drawer menu containing same nav links + login/avatar, ensure 44×44px touch target (FR-4)
- [ ] T024 [US3] **Verify Scenario 3**: snap chromium screenshot at 375/414/768/1280 (`/tmp/004-shots/home-${w}.png`), open each manually, confirm: no horizontal scroll, CTA visible & tappable, Header collapses to hamburger on mobile (FR-4)

**Parallel opportunities**: T020 / T021 / T022 are all in `page.tsx` but on different sections — they can be edited in one pass but listed separately for clear accountability. T023 is independent (Header.tsx).

## Phase 6: User Story 4 — Scenario 4 / P4(SNS 分享访客)

**Story goal**: 用户在 SNS 看到分享卡片,点入后页面 `<title>` 与 og:title 一致,缩略图真实且 ≥ 1200×630。

**Independent test criteria**:
- HTML 源码 `<head>` 含 `og:title` / `og:description` / `og:image` / `twitter:card` 四字段且非空
- OG Debugger / FB Sharing Debugger 预览卡片正确

- [ ] T025 [US4] In `apps/web/app/page.tsx`: add `export function generateMetadata()` returning `{ title, description, openGraph: { title, description, images: ['/og.png'], type: 'website' }, twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] } }` (FR-5)
- [ ] T026 [US4] Verify og:image size: `file apps/web/public/og.png` — must report PNG 1200×630
- [ ] T027 [US4] **Verify Scenario 4**: `curl http://127.0.0.1:3000/ | grep -E 'og:|twitter:'` — all four meta fields present; manually visit https://www.opengraph.xyz/ and preview `/` URL, confirm card shows correctly (FR-5)

**Parallel opportunities**: T025 (page.tsx) and T026 (file check) are fully independent.

## Final Phase: Polish & Cross-cutting Concerns

> 收尾 + 跨场景的 FR-9 / FR-10 + Module F 验证 + Module G 文档。

- [ ] T028 [P] In `apps/web/app/page.tsx`: fix heading hierarchy — change h3 inside Features to h2 (or reorganize so h1→h2→h3 strictly) (FR-9)
- [ ] T029 [P] In `apps/web/app/page.tsx`: confirm all `<img>` tags have non-empty `alt` attribute (FR-9) — already done in T012 for the 2 example images, double-check any new images
- [ ] T030 [P] In `apps/web/app/page.tsx`: CTA hover state — `hover:bg-primary-700 hover:scale-105 transition` (FR-10)
- [ ] T031 [P] In `apps/web/app/page.tsx`: CTA active state — `active:bg-primary-800 active:scale-100` (FR-10)
- [ ] T032 [P] In `apps/web/app/page.tsx`: CTA loading state — wrap in small client component `apps/web/components/LoadingLink.tsx` that shows spinner on pending navigation using `useTransition` (FR-10)
- [ ] T033 [P] In `apps/web/components/Footer.tsx`: rewrite to 3-column desktop layout — left (logo from `/favicon.svg` + tagline), middle (产品链接:生成图纸 / 我的图纸 / 文档), right (版权 + 社交占位) (FR-7)
- [ ] T034 [P] In `apps/web/components/Footer.tsx`: mobile stacking — `grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1` (FR-7 + FR-4)
- [ ] T035 Install `@axe-core/playwright` and write `apps/web/tests/axe.spec.ts` — Playwright e2e test that navigates to `/` and runs `axe.run()` with tags `wcag2a,wcag2aa`, expects 0 critical + 0 serious (FR-9, research.md Decision 8)
- [ ] T036 Run `npx @axe-core/cli http://127.0.0.1:3000 --tags wcag2a,wcag2aa` — expect "0 violations"; iterate on fixes if any
- [ ] T037 Run Lighthouse mobile on `/`: `npx lighthouse http://127.0.0.1:3000 --preset=desktop --output=json --quiet --chrome-flags='--headless --no-sandbox' | jq '.categories | ...'` — confirm all 4 categories ≥ 90 (FR-9 + SC, research.md Decision 9)
- [ ] T038 In `README.md`: add "## 后续规划 spec" section listing 005 (i18n) / 006 (社会证明) / 007 (埋点) / 008 (SEO sitemap/robots) — each with one-line description
- [ ] T039 Update `memory/2026-09-20.md`:补完今日完整工作日志(首页 polish + spec kit 流程产出 + 6 commits + screenshots 路径)
- [ ] T040 Single commit with full message (see quickstart.md 末尾 template) + push to remote if origin exists

---

## Parallel execution matrix

For multi-agent or batch execution, these groups can run in parallel:

| Group | Tasks | Files touched |
|---|---|---|
| Setup group | T001-T005 | (no code) |
| Static assets group | T006-T011 | `apps/web/public/` |
| Layout/Header group | T016-T019 | `app/layout.tsx` + `components/Header*.tsx` |
| Footer group | T033-T034 | `components/Footer.tsx` |
| Validation group | T035-T037 | `tests/axe.spec.ts` + CLI runs |
| Docs group | T038-T040 | `README.md` + `memory/*.md` |

Within each group, all `[P]` tasks can run concurrently.

---

## Suggested first commit (P1 MVP)

After completing T001-T015, do a single commit:

```
feat(landing): P1 MVP — unlogged visitor landing flow

- Replace mock example with real CC0 photo + pypindou pattern
- Dynamic palette count from /palettes (1h ISR cache + fallback)
- CTA routes anonymous users to /login?redirect=/generate
- (P2/P3/P4/polish in follow-up commits)

Verified via headless Chromium screenshot at 1280x1600.
```

Then P2 / P3 / P4 / Polish as separate commits for clean history.

---

## Format validation

✅ All tasks follow `- [ ] [TaskID] [P?] [Story?] Description with file path` format.
✅ Setup / Foundational / Polish phases: NO story label.
✅ User Story phases (3-6): MUST have `[US#]` label, all do.
✅ Every task includes file path or verification command.
✅ Phase 1-2 contain 0 story labels (Setup + Foundational).
✅ Phases 3-6 each have `[US1]`/`[US2]`/`[US3]`/`[US4]` labels.
✅ Final Phase (Polish) has 0 story labels.