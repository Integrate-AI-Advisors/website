# IntegrateAI Website — Dawn Design System · v1

> The design source of truth for this repo. Static hand-written HTML/CSS/vanilla
> JS, no framework, no build step, zero runtime npm deps. Compositional
> reference for the hero: `assets/img/hero-comp-desktop.png` + `-mobile.png`.
> Full execution spec + gates: `docs/BUILD-PLAN.md`. Locked copy:
> `docs/SITE-COPY.md` (verbatim, British English).
>
> This file replaced a stale pre-Dawn document (DM Serif Display / terracotta /
> GA4 / Cal.com qualify form) on 2026-07-15 — none of that exists in this build.

## Laws (non-negotiable)
1. **Warmth is load-bearing.** The dawn palette's golden/ivory light leads every
   surface. `--grad-page`'s 315° axis parks slate across the right half of any
   wide/short box — re-weight per-section with a golden radial at the top-left
   source; slate holds only far corners. No cold-blue drift, ever.
2. **No words in rasters.** Text is HTML; artwork is code-drawn SVG/canvas.
3. **Ink never sits on slate without an ivory wash.**
4. **One animation idea: the network is alive.** Everything else is one-shot,
   IO-gated (paused off-viewport), `.js`-gated (no-JS renders finished state),
   and lands finished under `prefers-reduced-motion`. Print forces content
   visible. Transform/opacity/filter only.
5. **Honesty.** No invented metrics/testimonials/client names; every demo is
   captioned "Shown with sample roastery data"; Northwind is the only fictional
   company; never name real clients without consent. Banned words: leverage,
   synergy, bot, AI-powered, revolutionary, seamless.

## Files
- `assets/styles.v1.css` — the complete system (this doc describes it).
- `assets/app.v1.js` — behaviour: reveal IO, sticky nav clone, drawer, hero
  canvas sparkles, dashboard draw-once, approvals simulator, pipeline IO,
  form fetch. All gated as per law 4.
- Cache law: `/assets/*.v1.*` is served immutable for a year (vercel.json).
  Any post-deploy content change to these files must bump `.v1` → `.v2`.

## Palette
Ink `#1E2A45` · ink-soft `#44506B` · dawn-ivory `#F2EDE3` · haze `#C7CEDA` ·
slate `#5E6F8D` · glow-core `#FFF4DC` · glow-particle `#F3E4BE` · surface
`#FBF9F5`. **Bronze thread** (accents, rules, icons, numerals): bronze
`#A87938` · bronze-bright `#C99B4F` · bronze-deep `#6B5128` (AA on ivory —
use for small text; plain bronze is decorative only). Success green `#3D6B4E`,
risk `#B4643C`.

## Type
- **Fraunces variable** (self-hosted, optical sizing on, `'SOFT' 28`) —
  h1/h2/h3, card titles, FAQ questions, price line, italics for emphasis and
  editorial numerals.
- **Inter variable** — body/UI.
- Scale: h1 `clamp(3rem→4.6rem)` · display beats (problem/pricing/closer)
  `clamp(2.4→3.9rem)` · working h2 `clamp(2→3.1rem)` · h3 `1.3rem` serif ·
  lead `clamp(1.15→1.375rem)` · body `1.0625rem` · small `.92rem`.
- Eyebrows: `.78rem`, `.22em` tracking, bronze-deep, 26px bronze rule prefix.
- Headings: `text-wrap: balance`, tight leading (1.03–1.06), −.022em tracking.

## Rhythm
Working sections `--space-section: clamp(4.5→6.75rem)`; narrative beats
(problem, pricing, closer) `--space-beat: clamp(6→9rem)`. Sections alternate:
ivory → `.section--wash` (warm top wash) → panel moments. Chapter dividers are
bronze gradient hairlines, not flat ink lines. Site-wide film grain: fixed
`body::after`, 1.8% soft-light, z-30 (under the drawer at z-40).

## Components
- **Buttons**: pill silhouette. `.btn` = surface + bronze hairline;
  `.btn--primary` = warm ink gradient + ivory text + golden hover bloom —
  ONE per view (hero, pricing, closer, form submit; nav stays secondary).
  Arrow slides 4px on hover.
- **Cards** (`.card`): warm gradient surface, bronze hairline, serif titles,
  bronze icons + italic serif numerals (`.card__num` 01–04), −3px hover lift.
- **Objections** (`.objection`): NOT cards — two-column strips, italic serif
  questions over bronze hairlines. Never render two card grids on one page.
- **Glass proof frames** (`.proof`): inner ivory highlight + ambient + key
  shadow; inner radius = outer − padding.
- **Pipeline diagram** (`.pipeline`): tools → brain → approved actions; CSS
  shimmer on `.is-live` only.
- **FAQ**: serif questions, bronze `+` rotating 45°, warm hairline rows.
- **Trust**: two-column bronze-tick list + italic serif reassurance line.
- **Strip**: letterspaced uppercase wordmarks at 62% ink.

## Accessibility gates (hold on every change)
axe clean · Lighthouse mobile ≥95 all categories · touch targets ≥44px ·
focus-visible bronze-deep ring · body text ≥16px AA · no horizontal scroll
320–3440px · keyboard drawer trap + Escape · single h1 per page.
