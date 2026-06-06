# IntegrateAI Website v2 — Design System

> Shared foundation for the website rebuild. Hand-written static HTML/CSS/vanilla
> JS, no framework, no build step. Served as-is on Vercel. Brand tokens LOCKED
> (see `01-brand/brand-tokens.md` in the vault). This file documents the
> consumable API: tokens, type, section rhythm, components, and JS init signatures.

## Files
- `assets/styles.css` — the complete design system (this doc describes it).
- `assets/app.js` — behaviour layer. Exposes `window.IAA.*`. Auto-wires nav,
  scroll-reveal, count-ups, cookie/GA4 gate, hero shimmer on `DOMContentLoaded`.
- `assets/demo-data.js` — all sample data (fictional). Exposes `window.IAA_DEMO.*`.

## Honesty rules baked into the system
- ONE pre-launch client, ZERO live results. Never invent metrics/testimonials/logos.
- No real third-party brand names on public pages. The only fictional company is
  "Northwind Coffee Roasters" — an illustrative composite, labelled as such.
- Every demo carries a legible `.demo-label` ("An example — not a real client" /
  "Sample data" / "Sample — no real credentials stored").
- The dashboard time axis renders a `.dash__projection` badge ("Projection · not
  real history") — never narrated as elapsed history.
- British English. Banned words: leverage, synergy, disrupt, cutting-edge,
  paradigm, bot/chatbot, seamless, revolutionary, game-changing, world-class.
  Agents = "workforce / team member / specialist". Price = "investment".

## Carry-forward (already in app.js / to add in page <head>)
- GA4 `G-RT7VN5KQHC` — loaded ONLY after cookie consent (see cookie gate below).
- JSON-LD (LocalBusiness + FAQPage), OG tags, `<link rel=canonical>`,
  `theme-color #1A1A19`, Google-Fonts import — copy from
  `archive/index-v2-pre.html` <head> into each page.
- Fonts: `DM+Serif+Display:ital@0;1 | Inter:wght@300;400;500;600;700 |
  JetBrains+Mono:wght@400;500;600 &display=swap`.

## Colour tokens (CSS custom properties)
Core: `--terra #D97757` (the ONLY action colour), `--terra-deep #C0613F`
(hover), `--terra-ink #14120F` (dark text that sits ON terracotta fills — AA),
`--dark #1A1A19`, `--cream #FAF9F5`, `--ink #111110`, `--white`.
Text: `--grey #3A3935` (body on light), `--muted-strong #6E6A64` (AA captions on
cream), `--muted #9A9590` (DECORATIVE / large only — fails AA for body),
`--on-dark #FAF9F5` (text on dark), `--on-dark-2 #C7C3BC` (AA body on dark).
Tints: `--lterra #F5E6DE`, `--lgrey #F0EFEB`, `--border #E5E2DC`.
Phase: `--green #4A7C59`, `--blue #4A6FA5`, `--amber #C4943A`, `--purple #7B61A5`,
`--red #C25B56` (+ `*-deep` AA variants + `*-bg` tints).

### Contrast rule (verified)
Terracotta FAILS AA for normal body text on both cream (2.96:1) and dark (5.58:1
— large only). So terracotta is used ONLY for: large headings/eyebrows, button
FILLS (with `--terra-ink` dark text on top = 5.99:1 ✓), and non-text accents.
For readable small captions use `--muted-strong` (5.1:1 on cream ✓), never
`--muted`. Body: grey-on-cream 10.97:1, on-dark-2-on-dark 9.92:1.

## Typography
Fonts: `--serif` (DM Serif Display — headings, never bold, weight 400, large
only), `--sans` (Inter — body/UI), `--mono` (JetBrains Mono — uppercase
labels/numbers). Type scale vars: `--fs-label .66rem`, `--fs-meta .68rem`,
`--fs-body 1rem`, `--fs-body-sm .875rem`, `--fs-lead clamp`, `--fs-h3`,
`--fs-h2 clamp(1.9,4.6vw,2.9rem)`, `--fs-h1 clamp(2.6,8vw,4.4rem)`.
Classes: `.h1 .h2 .h3` (auto-recolour per section mode; `em` inside = terra
italic), `.eyebrow` (mono terra label), `.lead`, `.copy`, `.meta` /
`.meta--strong`, `.section__head` (centred title block). `--center` modifiers on
`.copy`/`.lead`.

## Spacing
8pt scale: `--s-1 4px` `--s-2 8` `--s-3 12` `--s-4 16` `--s-5 24` `--s-6 32`
`--s-7 48` `--s-8 64` `--s-9 96` `--s-10 128`. Layout: `.wrap` (max 1080px),
`.wrap--narrow` (760px), `.section` (96px vertical padding). Radius: `--r-card
12px`, `--r-pill 100px`. Motion easing: `--ease cubic-bezier(.16,1,.3,1)`,
`--ease-spring`.

## Section rhythm (the heartbeat — ALTERNATE dark <-> cream)
Put `.section--dark` or `.section--light` on every `<section>`. These set the
background AND the correct text/heading/border/card colours for that mode — all
child components (`.h2`, `.copy`, `.card`, `.appcard`, `.pillar`, `.dash`, form,
etc.) auto-adapt. Never stack two same-mode sections without a visual break.
Optional `.divider` (3 breathing terra dots) between sections.

## Components (CSS class API)

### Buttons
`.btn` base. `.btn--primary` = terracotta fill + dark ink text (ONE per surface).
`.btn--ghost` (adapts to mode). Modifiers `.btn--lg`, `.btn--block`. Add
`.btn--shimmer` for a single shine pass. Track booking clicks with
`data-track="cta_book_click" data-cta-source="hero"`.

### Pills / tags
`.pill` + `.pill--terra|green|blue|amber|purple|red`. `.pill__dot` (add
`.pill__dot--live` for a breathing dot).

### Cards / callouts
`.card` (auto light/dark, hover lift; `.card--flush` for zero-padding media
cards). `.callout` (terra left border; `.callout__title`).

### Honesty labels
`.demo-label` (readable, with `.demo-label__mark` amber dot) — put beneath each
demo. `.demo-note` (stronger inline "illustrative composite" note for Northwind).

### Nav (fixed, frosted)
`#nav.nav` > `.nav__in` > `.nav__logo`(`.nav__mark` 8-dot matrix + `.nav__brand`
with `.ai` span) + `.nav__links` + `.nav__cta` + `#nav-toggle.nav__toggle`.
Mobile overlay `#nav-mobile.nav__mobile` (`.nav__mobile-top/-link/-bottom`).
JS adds `.is-scrolled` past 20px and toggles `.is-open`. Needs IDs `#nav`,
`#nav-toggle`, `#nav-mobile`, and `#scroll-progress` for the progress bar.

### Four-pillar cards
`.pillars` grid > `.pillar` + colour variant `.pillar--customers|efficiency|
revenue|cost` (sets the 3px top accent bar via `--pillar-accent` = green/blue/
terra/purple). Add `.pillar--dominant` to the ONE pillar the hero demo pays off
(subtle ring + tint). Inside: `.pillar__icon`(svg) `.pillar__title`
`.pillar__body`.

### Connect grid (paste-a-key)
`.connect-grid` > `.connect-tile` (`.connect-tile__name`, `.connect-tile__dot`).
Add `.is-connected` to flip the dot to a breathing green. Label beneath:
"Sample — no real credentials stored."

### Economics (static type — NO aggregated count-up)
`.econ-grid` > `.econ-row` (`.econ-row__role`, `.econ-row__cost` terra serif,
`.econ-row__note` mono). Per-role costs only; never a single big animated total.

### Cookie banner
`#cookie.cookie` with `.cookie__text`, `.cookie__actions` >
`button[data-cookie-accept].cookie__btn--accept` +
`button[data-cookie-decline].cookie__btn--decline`. JS shows it after 900ms and
only loads GA4 on accept; choice stored in `localStorage` key `iaa_consent`.

## JavaScript API (`window.IAA`)

### `IAA.initApprovalLoop(rootEl, scenarios, opts?)`
Renders risk-tiered Slack approval cards into `rootEl`. One card = hero; many =
queue (`.approval--queue`). `opts.announce` (default true) adds an `aria-live`
region. State machine per card: idle → approving → executing (1.4s bar) → done
(green tick) → thread confirm (appended ~1.8s later). Buttons: Approve / Request
changes (only if `scenario.redraft`) / Decline. Reduced-motion renders the END
state instantly. Fires `demo_interact` analytics events.

Scenario shape:
```js
{ id, app:'IntegrateAI', appBadge:'APP', time:'08:14',
  risk:'green'|'amber'|'red', riskLabel:'Needs your sign-off …',
  title, detail, facts:['£1,840.00','Matches PO #4471'],
  confirm:'Done — …',
  redraft:{ changesNote, redraftTitle, redraftDetail, redraftConfirm } } // optional
```
The redraft block drives the "Request changes → redraft → auto-approve" micro-flow.

### `IAA.initDashboard(rootEl, data)`
Builds KPI cards + SVG line chart (stroke-dasharray draw-once) + donut
(stroke-dasharray) + staggered wholesale table. IntersectionObserver-gated
(threshold .25), draws ONCE, never loops. The chart panel always shows the
`Projection · not real history` badge. Reduced-motion = instant end state.

Data shape:
```js
{ title, aria,
  kpis:[{ value:Number, prefix:'£', suffix:'k', dec:0, label, sub }],
  chart:{ caption, aria, yMax, points:[{x:'Month 1', y:Number}, …] },
  donut:{ caption, aria, segments:[{ label, value, colour:'#4A6FA5' }, …] },
  table:{ caption, columns:[…], rows:[[…],…], trends:['up'|'down'|'flat'] } }
```

### `IAA.initQualifyForm(formEl, opts?)`
Pure client-side gate. Field `name`s expected: `company`, `website`, `revenue`
(select), `tools` (checkbox group), `role` (select), `company_url` (honeypot in
`.qpot`). On PASS → redirects to Cal.com (default base
`https://cal.com/chad-pickard-integrateai`) with answers as prefill query params,
plus a `#cal-fallback` mailto shown after 2.5s if the redirect stalls. On FAIL →
reveals + focuses `#soft-decline` (gracious, non-numeric; calendar never shown).
Validates required fields with `aria-invalid` + `.qfield.has-error` + visible
`.qfield__error`. Fires `lead_form_submit` then `cta_book_click`.
`opts`: `{ calBase, mailto:'hello@integrate-ai.uk', passRevenue:['band-a',
'band-b','band-c'], minTools:1, softSelector:'#soft-decline' }`.

Form markup uses: `.qform`, `.qfield` (>`label`,`.qinput`/`.qselect`,
`.qfield__error`,`.qfield__hint`), `.qtools`>`.qtool`(`input`+`label` chips),
`.qpot` (honeypot), `.soft-decline`(`__title`,`__body`,`__alt`).

### Auto-wired on load (no call needed)
Scroll-reveal (`.reveal` → `.is-visible`; children `[data-reveal-child]` stagger
80ms), count-ups (`[data-count]` with `data-prefix/suffix/dec/dur`), nav
scroll/toggle, `#scroll-progress` bar, cookie→GA4 gate, hero shimmer
(`[data-hero-shimmer]` element with class `.hero-shimmer`, one pass).
Helper: `IAA.track(name, params)` fires GA4 events only after consent.

## demo-data.js exports (`window.IAA_DEMO`)
- `heroScenarios` — array, 1 brand-neutral card (overdue supplier invoice, amber).
- `heroAltScenario` — single object, brand-neutral margin alert (green).
- `northwindScenarios` — array of 6 F&B cards (fictional roaster); index 3
  (`nw-wholesale-redraft`) carries the redraft micro-flow; spans green/amber/red.
- `northwindHero` — array with one opener card (the quiet-account amber scenario).
- `northwindDashboard` — `initDashboard` data (6 KPIs, projected line chart,
  channel donut, 5-row wholesale table; all invented £ figures).
- `connectProviders` — array of generic provider tiles for the connect grid.
- `economicsRoles` — array of per-role static salary-benchmark rows.

All account names (The Bridge Café, Hartwell Provisions, Meadowgate Foods,
Selby & Crewe Deli, Riverside Kitchen), products (Harbour Blend, Old Town
Espresso, Ethiopia/Colombia single origins) and figures are invented.

## Accessibility & motion (system guarantees)
Skip link (`.skip-link` → `#main`), `:focus-visible` terra outline, `.sr-only`,
aria-live on approval state changes, SVG charts have `role=img` + `aria-label`,
form labels + error association, semantic table with `scope`. Motion: scroll
fade-up, breathing dots, one hero shimmer, count-ups + SVG draws run ONCE.
`@media (prefers-reduced-motion: reduce)` + per-component `REDUCED` branches
render final state instantly. Animate transform/opacity only; mobile-first.
