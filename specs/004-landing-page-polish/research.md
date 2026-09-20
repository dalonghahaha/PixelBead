# Research — Feature 004 Landing Page Polish

> Phase 0 outputs. Captures decisions + rationale + alternatives considered for each Technical Context unknown. No implementation code, no full bodies — only the "why" behind each design choice.

## Decision 1: Unsplash CC0 photo selection for FR-1 example
**Chosen**: A single small animal / cartoon / food photo from Unsplash (license: Unsplash License = free for commercial & non-commercial use, no attribution required, effectively CC0-equivalent for our purposes). Concrete candidate: a corgi or a single donut, single subject, high contrast, ≤ 200KB JPG.

**Rationale**:
- Single-subject, high-contrast photos make the most convincing bead pattern after pypindou reduction (vs landscapes or scenes with 100+ colors that produce muddy bead grids).
- Small file size (≤ 200KB) keeps `public/examples/original.jpg` lightweight — won't bloat First Load JS / network.
- Unsplash License allows redistribution, which we need because we're shipping the image inside `public/`.

**Alternatives considered**:
- **Generate via AI** (Stable Diffusion / DALL-E): adds infrastructure, model selection, prompt engineering, output variance — overkill for a static placeholder.
- **Stock photo with attribution** (Pexels / Pixabay): equivalent licensing, but Unsplash API ergonomics are slightly better and our asset pipeline already uses static file URLs.
- **Hand-painted SVG**: would work but looks fake at the same physical size as a real photo, defeating the "looks real" goal of FR-1.

## Decision 2: pypindou invocation for static pattern generation
**Chosen**: A one-off Python script `apps/web/scripts/gen-example-pattern.py` that:
1. Reads `apps/web/public/examples/original.jpg`
2. Calls `pypindou.image_to_pattern(...)` with a fixed config (29×29 grid, MARD palette, dithering on)
3. Writes the PNG to `apps/web/public/examples/pattern.png`

Run manually during scaffold; checked into repo. Not a runtime dependency.

**Rationale**:
- Per Q1 clarification: static bundling was preferred (zero API dependency at runtime, deterministic, offline-friendly).
- pypindou is already a project dep (per 001), no new infra.
- Script is throwaway after first run — checked-in output is the artifact, not the script's ongoing execution.

**Alternatives considered**:
- **Build-time generation** (Next.js `public/` build hook): premature engineering for a single static asset.
- **Server-side endpoint** (`/api/patterns/sample`): rejected per Q1 (adds runtime dep + latency).
- **Hand-coded SVG grid**: would not look like real bead output (no dithering, no color quantization).

## Decision 3: Server Component cookie reading for FR-2
**Chosen**: `apps/web/app/layout.tsx` is a Server Component that reads the session cookie via `next/headers` (`cookies()`), looks up user, and passes `{ loggedIn, user }` props down to `<Header />`. Header is split: a server parent that handles the conditional rendering, plus a small client child (`UserMenu.tsx`) for the avatar dropdown's open/close interactivity.

**Rationale**:
- Per Q2 clarification: Server Component cookie read was preferred (zero flicker, SSR-friendly, SEO-friendly).
- Next.js 14 App Router + RSC pattern is already in 001 — extending it doesn't add a new paradigm.
- Splitting Header into server parent + client child keeps the JS bundle small (only the dropdown needs `'use client'`).

**Alternatives considered**:
- **Pure client useEffect fetch `/me`**: rejected per Q2 (flash of un-authenticated UI).
- **Context Provider wrapper**: rejected per Q2 (extra abstraction not needed for this scope).
- **next-auth integration**: rejected — 002 may or may not use next-auth; if it doesn't, we don't introduce the dep.

## Decision 4: Dynamic palette count via fetch with cache + fallback
**Chosen**: In `apps/web/app/page.tsx` (Server Component), `await fetch(API_URL + '/palettes', { next: { revalidate: 3600 } })`. Parse JSON, take `.length`, render `"N 种真实拼豆色板"`. If fetch throws or returns non-2xx, render fallback `"20+ 种真实拼豆色板"`.

**Rationale**:
- Per Q3 clarification: dynamic with cache was preferred (accurate, drift-proof, tolerable latency).
- `next.revalidate = 3600` is Next.js's first-class ISR primitive — no extra cache library needed.
- Fallback text `"20+"` is honest (under-promise) — better than showing stale "26" forever after a palette removal.
- Hard floor of 20 is safe even if API down: pypindou has ≥ 3 brands × ≥ ~10 colors each at last check, so 20 is a guaranteed under-count.

**Alternatives considered**:
- **Static constant `26`**: rejected per Q3 (drift risk).
- **Client useEffect fetch**: rejected per Q3 (flash).

## Decision 5: Logo design — 8×8 bead grid SVG
**Chosen**: Hand-authored SVG of an 8×8 pixel grid where ~5 cells form a stylized "P" letter using 3-4 bead colors (orange, blue, yellow + background). Stored at `apps/web/public/favicon.svg`. Header + Footer reference it via `<img src="/favicon.svg" />` or inline `<svg>` copy.

**Rationale**:
- Per Q4 clarification: self-designed SVG was preferred (no external asset dependency).
- 8×8 is small enough to look like real pixel beads at favicon size (16×16 / 32×32) and at Header height (~24-32px).
- Hand-authored means it's editable later without tooling.
- Single SVG file reused across favicon / Header / Footer keeps visual identity consistent.

**Alternatives considered**:
- **Wait for design from 大龙**: rejected per Q4 (would block the spec).
- **No logo, text only**: rejected per Q4 (worse visual).

## Decision 6: Mobile responsive breakpoints
**Chosen**: Use Tailwind defaults — `sm: 640px / md: 768px / lg: 1024px / xl: 1280px`. Our three target widths (`375 / 414 / 768 / 1280`) align well:
- `< 640px` (375/414): single column everything, hamburger menu
- `640-1024px` (768): 2-col example section, 3-col features, no hamburger
- `≥ 1024px` (1280+): same as 768 but with more breathing room

**Rationale**:
- Tailwind defaults are industry-standard — no custom config needed in 001.
- The three target widths in spec.md already map cleanly onto these breakpoints.

**Alternatives considered**:
- **Custom breakpoints**: rejected — premature; Tailwind defaults cover the spec's required widths.

## Decision 7: og:image sizing & format
**Chosen**: 1200×630 PNG, ≤ 200KB, depicting a representative bead pattern (can reuse `examples/pattern.png` resized, or a dedicated static). Stored at `apps/web/public/og.png`.

**Rationale**:
- 1200×630 is the minimum size Facebook / Twitter / LinkedIn all accept for large-image cards.
- PNG is lossless and universally supported.
- Can reuse the example pattern (saves a new asset).

**Alternatives considered**:
- **Use original photo as og:image**: rejected — the value proposition is the bead output, so the diagram should be the social preview.
- **SVG og:image**: rejected — most SNS crawlers don't render SVG.

## Decision 8: Axe-core validation
**Chosen**: Run `npx @axe-core/cli http://127.0.0.1:3000 --tags wcag2a,wcag2aa` against the dev server. Must report 0 critical + 0 serious.

**Rationale**:
- Standard, automated, no browser plugin needed.
- Catches missing alt, low contrast, heading skip, missing focus, etc.

**Alternatives considered**:
- **Lighthouse Accessibility audit only**: insufficient — Lighthouse only spot-checks.
- **Manual review**: error-prone for color contrast + focus order.

## Decision 9: Lighthouse threshold
**Chosen**: Lighthouse mobile (Moto G4 profile, 3G throttling) for Performance + Accessibility + Best Practices + SEO. Each ≥ 90.

**Rationale**:
- Spec.md already locks this as Success Criterion.
- 90 is the conventional "good" threshold Google itself recommends.

## Out of Scope — Re-confirmed

Per Q5 clarification + spec.md Out of Scope:
- i18n → 005 (separate spec)
- Social proof → 006 (separate spec)
- Analytics → 007 (separate spec)
- Sitemap / robots → 008 (separate spec)
- A/B testing, cookie banner, etc.

These will be referenced in plan.md's "Future spec anchors" section but NOT implemented in 004.