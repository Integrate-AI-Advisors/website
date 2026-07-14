---
title: "IntegrateAI Website — Build Plan v2 (Dawn)"
type: build-plan
created: 2026-07-13
owner: chad
status: "v2 authored around Chad's locked hero artwork. Supersedes BUILD-PLAN.md (chrome+terracotta v1)."
tags: [website, marketing, operating-brain, build-plan, ws-13]
---

# IntegrateAI Website — Build Plan v2 · "Dawn"

Chad supplied finished hero artwork (desktop + mobile) on 2026-07-13 and asked for a fresh
plan built around it, disregarding the v1 plan. This is that plan. **The design is now
LOCKED by the artwork itself** — palette, type, hero copy and the connected-systems motif
all come from the image, not from a brief that still needs generating against.

> Supersedes [`BUILD-PLAN.md`](BUILD-PLAN.md) and [`site-copy.md`](site-copy.md) (v1).
> Copy deck for this plan: [`site-copy-v2.md`](site-copy-v2.md). Workstream: **WS-13**
> (already claimed, ledger unchanged — same workstream, new direction).

## 1 · What changed vs v1 — and what survives

**Dead (design taste, replaced by the artwork):** chrome brain motif, terracotta accent,
the anti-blue colour law, the 12-asset generation plan, the master-plate workflow, the
decomposed-hero decision (D2). The artwork is a single finished raster and it works.

**Alive (business facts, not taste — these survive any redesign):**
- **Newground consent gate** — naming them or reusing their demo needs their OK first.
- **Trust-strip claims verified line-by-line against the executed DPA** before publish.
- **Pricing is resolved** — public price from **£500/mo** (D-CTO-2026-07-03-1); the £250
  beta figure never appears publicly.
- **Diagnostic CTA → existing cal.com link**; keep `/privacy`; cookieless Vercel Analytics.
- **gstack build discipline** — `/autoplan` before code, `/design-consultation` fed these
  tokens, `/review` + `/ship` + `/land-and-deploy` with founder go on the ship steps.

**One honest note on the blue.** v1 banned blue because AI-generated "tech glow" defaults
to a cold, generic cyan. This palette is not that — it is a *dawn* image: warm ivory light
falling onto slate blue, with a golden core. The warmth is load-bearing. Every derived
asset and every CSS gradient must keep the warm light source, or the site collapses into
exactly the cold AI-slop v1 was defending against.

## 2 · Positioning and voice

**Category line:** the **operating brain** — the artwork's own word, and better than plain
"Company Brain" because "operating" bakes in the differentiator (*it does, not just knows*).
We still never claim to have coined anything.

**The story in one breath:** your tools each know one thing; nothing joins it up except
you. The operating brain connects what you already use, understands the whole business,
and acts on it — with your approval on every move.

**Narrative spine (from the hero subhead itself):** **Connects → Understands → Acts.**
The subhead says "connects your systems, understands your business, and guides your next
move" — the homepage simply proves those three verbs in order, then closes. This replaces
the v1 8-section spine.

**Voice:** calm, editorial, plain British English. Confident enough not to shout — the
serif does the elegance, the copy does the clarity. Written for a non-technical SME
founder. Banned: leverage / synergy / bot / AI-powered / revolutionary / game-changing.

## 3 · Design system (derived from the artwork)

| Token | Value | Source in artwork |
|---|---|---|
| `--ink` | `#1E2A45` | headline navy |
| `--ink-soft` | `#44506B` | subhead / body |
| `--dawn-ivory` | `#F2EDE3` | top-left light |
| `--haze` | `#C7CEDA` | mid gradient |
| `--slate` | `#5E6F8D` | lower-right dusk |
| `--glow-core` | `#FFF4DC` | hub glow |
| `--glow-particle` | `#F3E4BE` | filament sparks |
| `--glass` | `rgba(255,255,255,.55)` + 1px `rgba(255,255,255,.7)` stroke | node circles |
| `--surface` | `#FBF9F5` | CTA button |
| Radius | pill buttons ~14px; node circles full | CTA / nodes |

**Type:** display serif with true italics for the hero and section headlines — target the
artwork's high-contrast editorial serif. Free pick: **Fraunces** (opsz high, SOFT up,
italic for the accent word). Premium upgrade if we ever license: Canela. UI/body sans:
**Inter** (matches the wordmark's humanist geometry). Scale: hero ~clamp(2.6rem, 7vw, 5rem).

**Layout law:** light page top-to-bottom, gradient fields in CSS (never raster backgrounds
except the hero); generous whitespace; max-width ~1200px; the navy ink never sits on slate
without an ivory wash behind it (contrast check every section at build).

**Motion:** one idea, used sparingly — *the network is alive*. Slow particle drift and a
gentle filament shimmer over the hero raster (CSS/canvas overlay, not baked video); nodes
float ±4px on long easings; everything honours `prefers-reduced-motion`. No scroll-jacking,
no parallax circus. Section reveals: 200ms fade/rise, once.

**Accessibility:** `--ink` on `--dawn-ivory` is ~10:1 — fine. Links/buttons use `--ink` on
`--surface`. Never set text over the slate zone of the gradient without the ivory wash.
Hero raster gets full alt text; node labels are decorative there (repeated in real HTML in
the integrations strip).

## 4 · Site map

| Route | Purpose | v1 or v1.1 |
|---|---|---|
| `/` | the story (below) | v1 |
| `/coffee` | vertical landing for coffee outreach — re-led hero, same spine | v1 (gated on consent if it names Newground) |
| `/privacy` | keep — live site has one; refresh dates | v1 |
| `/about` | CUT 2026-07-13 — Chad dropped founder bios; no about route | — |
| `404` + redirects from old URLs | don't break inbound links | v1 |

Nav: How it works · Pricing · For coffee · **Book a diagnostic** (button). Footer: mark +
one-liner, privacy, company number, contact email. No blog at launch — nothing rots faster
than an empty blog.

## 5 · Homepage structure (the copy deck has full words)

1. **Hero** — the artwork, verbatim copy: "Give your business an *operating* brain." +
   subhead + diagnostic CTA + "30 minutes · No commitment". Integrations strip ("CONNECT
   WHAT YOU ALREADY USE" — Shopify, Xero, Klaviyo, Pipedrive, SKIO, Cropster, Google
   Workspace, Mail) rendered as real HTML logos, part of the hero as designed.
2. **The problem** — your tools work; they just don't work together. You're the only join.
3. **It connects** — plugs into what you already run; no migration; meets the business
   where it is. (Echoes the hero's radial motif — small CSS constellation, not a new raster.)
4. **It understands** — reads across everything at once; the living picture no single tool
   can see. Proof: real dashboard screenshot.
5. **It acts** — chases, replies, flags, prepares; the four outcomes it never stops
   working on (customers · time · revenue · waste), each earned with a cross-system catch.
6. **You approve every move** — Slack approval card, green/amber/red, from your phone.
   Proof: real Slack screenshot. Bridge line: one brain, presenting as a small team of
   specialists in your Slack.
7. **Your data stays yours** — five DPA-verified claims. `[DPA]` gate before publish.
8. **Pricing** — the impossible-hire anchor; **from £500/mo**; no long contract; free
   diagnostic first.
9. **Why not…?** — ChatGPT / Zapier / a part-time VA, three one-liners + 4-question FAQ.
10. **The close** — first client live now; we'll publish the real numbers, good or bad;
    diagnostic CTA again.

*(2026-07-13: "Who's behind it" founders section CUT per Chad — bios out.)*

**Cut from v1:** the interactive "try-it card" with preset chips. The artwork doesn't have
it, it's the single biggest build risk on the page, and a canned demo can undercut the
promise. It becomes a v1.1 candidate once the real product can back it.

**v1.1 candidates (post-launch, not on the critical path):** try-it card (above); launch
video + coffee explainer + product motion walkthrough via **HyperFrames** (HTML→MP4,
free/local, agent-driven — assessment: `05-knowledge/tools/hyperframes.md`), including a
`frame.md` derived from the final Dawn DESIGN.md so all future video stays on-brand.

## 6 · Assets — REVISED 2026-07-14 (comps inspected)

**What we have:** Chad's two renders, filed as `assets/hero-comp-desktop.png` (1535×1024)
and `assets/hero-comp-mobile.png` (849×1851, phone-framed). **They are design comps, not
shippable assets** — headline, subhead, CTA and node labels are baked into the pixels
(blurry on retina, unselectable, invisible to search, fixed-size). They become the **style
masters**: every produced asset and the built page are judged side-by-side against them.

**Production tiers (elite = vector at the edges, raster only for atmosphere):**
- **Tier 1 — code-drawn SVG/CSS:** spark mark + favicon (hand-drawn vector), glass nodes +
  labels, connector filaments, particles (canvas), CTA, official brand SVG logos tinted
  navy, all typography as real HTML. This is what makes the hero crisp at any DPI *and*
  animatable (slow drift, shimmer, breathing nodes — `prefers-reduced-motion` honoured).
- **Tier 2 — the one AI raster:** the nebula backdrop (gradient + golden core + haze,
  NO nodes/text), produced img2img from the desktop comp as style reference (Higgsfield;
  GPT-image fallback), upscaled to ~4K. **Single-plate approval gate: Chad approves it
  against his comp before anything derives.** CSS gradient continues its exact colours
  beyond the image edges.
- **Tier 3 — real product framed in code:** dashboard + Slack captures at 2× on sample
  data, set in code-drawn glass cards with house shadow + grain.
- **OG image** — 1200×630, HTML render of the hero composition. Not image-gen.

**Quality gates:** 2× minimum exports, AVIF/WebP; unifying grain overlay across code +
raster layers; warmth check vs comp at every step (cold-blue drift = reject); `impeccable`
critique→audit→polish on the built page; **no words in any raster, ever.**

**Generation budget:** one backdrop plate + one upscale. Everything else deterministic code.

## 7 · Tech & build

- **Repo:** `Integrate-AI-Advisors/website`, fresh branch off `website-v2` (the component
  bones are good; the lead story and skin change). Vercel, preview subdomain throughout —
  Chad sees every build before it's public.
- **Stack (CORRECTED at eng review 2026-07-14):** hand-written static HTML/CSS/vanilla JS,
  no framework, no build step — the repo's existing discipline, and right for a one-pager
  with no server state. ONE Vercel serverless function (`/api/`) for the soft-CTA form.
  Vercel Analytics (cookieless — no banner, which is itself part of the privacy story).
- **Pipeline (CLAUDE.md build discipline, non-negotiable):**
  `/autoplan` on this plan + copy deck → `/design-consultation` seeded with §3 tokens (it
  ratifies/refines, it does not re-invent — the artwork is the design authority) →
  build in shippable PR units → `/review` + `/security-review` → `/ship` →
  **founder go** → `/land-and-deploy` → `/canary`.
- Fork `chadpickardstudio/Newgroundcoffee` → org **only if** the demo gets used anywhere
  (deferred with the try-it card).

## 8 · Gates (all external/legal — the design gates of v1 are gone)

| Gate | Blocks | Clear by |
|---|---|---|
| G1 Newground consent | naming them on `/coffee`, real screenshots of their data | read executed MSA for a publicity clause; if absent, I draft the one-line ask, **Chad sends**. Fallback: de-Newgrounded sample data + "first client live now". |
| G2 DPA-verified trust strip | §7 + FAQ data claims | line-by-line check against `DPA-IntegrateAI-Newground-2026-07-09.pdf` |
| G3 Sitemap hygiene | go-live | `/privacy` preserved, 404, redirects, cal.com link verified live |

No taste gates: the hero is approved by construction (Chad made it), pricing is decided,
theme is decided. The only approvals left are the ones only a founder can legally give.

## 9 · Sequence

1. **Now (this session):** plan v2 + copy deck v2 written; v1 docs banner-marked superseded.
2. **Chad:** 10-minute read of both docs; answer the two questions in §11; green-light G1 ask.
3. **Asset pass (½ day):** SVG mark + favicon, hero upscales/exports, OG image.
4. **Spec → `/autoplan` → `/design-consultation`** (seeded, not open-ended).
5. **Build** on the branch in PR units: shell+hero → story sections → trust/pricing/FAQ →
   `/coffee` → polish (`impeccable` pass) — preview URL shared at each unit.
6. **Gates green → `/ship` → founder go → `/land-and-deploy` → `/canary`.**

Realistic elapsed: the build itself is 2–3 focused sessions once §11 is answered; the only
thing that can stall it is G1, which is why the ask goes out at step 2, not at launch.

## 10 · Risks

- **R1 — Warmth drift.** Derived assets/CSS lose the golden light → generic cold blue.
  *Mitigation: §1 note is written into the design-consultation seed; contrast + warmth
  check at every review.*
- **R2 — Hero raster at odd viewports.** One image must serve 320px→4K.
  *Mitigation: two source crops + art-directed `<picture>`; CSS gradient continues the
  image beyond its edges so it never letterboxes.*
- **R3 — G1 refused/slow.** *Mitigation: fallback copy already written (sample-data
  screenshots, "first client live now"); `/coffee` ships de-Newgrounded.*
- **R4 — Copy drift between decks.** Two plan generations in one folder.
  *Mitigation: v1 files carry superseded banners pointing here; only v2 feeds gstack.*

## 11 · Decisions from Chad — RESOLVED 2026-07-13

1. **Hero subhead** — Chad delegated; **LOCKED verbatim** ("guides your next move") —
   matches the approved artwork; the *Acts* section carries the doing.
2. **"Operating brain"** — no veto; it's the recurring label site-wide.
3. **Footer legal entity** — **Integrate AI Advisors Ltd, company no. 17134367**
   (Companies House verified 2026-07-13; incorporated 2 April 2026, active).
4. **Founder bios — CUT** (Chad). Section removed from spine, `/about` dropped.

Still standing: **green-light the G1 consent line** (I draft, Chad sends).

## 12 · Definition of done

Live at the production domain: dawn design faithful to the artwork; price shown from
£500/mo; trust strip published only after DPA verification; `/privacy` + redirects
preserved; `/coffee` live (consent-dependent flavour); diagnostic CTA wired to cal.com
and tested; cookieless analytics on; footer carries the registered entity + company
number; WS-13 closed in the ledger with PR links.

<!-- /autoplan restore point: ~/.gstack/projects/Integrate-AI-Advisors-website/website-v2-autoplan-restore-20260714-144034.md -->

---

# GSTACK AUTOPLAN — Phase 1 (CEO) — 2026-07-14

**Mode: SELECTIVE EXPANSION · Voices: [subagent-only] (codex skipped per founder rule
stick-to-claude-no-codex) · Landscape check run (YC S26 RFS named the category; Hyper/
GBrain/Savant/nBrain are funded retrieval-first brains — our "does, not knows" wedge holds).**

## Premises — CONFIRMED by Chad 2026-07-14 (gate passed)
1. Site = credibility check for warm founder-led coffee outreach, NOT a cold-traffic
   engine. Build timeboxed to **3 sessions hard**; overflow → v1.1.
2. £500/mo shown as a hypothesis diagnostics will test; one packaging scope line added.
3. Launch now, proof-less, honest close — don't wait for Newground numbers.
4. All capability copy in honest founding-client framing — no present-tense claims the
   product can't prove yet (UK ASA exposure removed).

## Founder decisions at this gate
- **D2 USER CHALLENGE ACCEPTED: minimal founder strip RESTORED** (two photos, first
  names, one line, LinkedIn). Reverses the earlier bios cut. Copy deck §10 to be re-added.
- **D3: generic-first homepage** + `/coffee` for outreach. Revisit if category noise grows.
- **D4: soft CTA added** — email capture → sample diagnostic teardown (fictional roastery,
  honesty-labelled). GDPR note + privacy-policy line required.

## CEO consensus (Claude subagent × primary — [subagent-only])
| Dimension | Subagent | Primary | Consensus |
|---|---|---|---|
| Premises valid? | 2 unstated | agreed | FIXED — premises added + confirmed |
| Right problem? | credibility not growth | agreed | CONFIRMED (timebox added) |
| Scope calibration? | over for job | agreed | CONFIRMED — 3-session cap |
| Alternatives explored? | 3 missing | partial | FIXED — see below |
| Competitive risk covered? | on-page no | agreed | FIXED — Why-not gets category rebuttal |
| 6-month trajectory? | sound if honest | agreed | CONFIRMED |

## Auto-decided findings (principles P1–P6) — audit trail
| # | Finding (subagent) | Decision | Principle |
|---|---|---|---|
| 1 | No traffic strategy stated | Premise 1 added + timebox | P3/P6 |
| 3 | Present-tense capability overclaims (ASA risk) | Copy re-framed founding-client | P1/P5 |
| 4 | "logged and reversible" false | Reworded: "asks before anything irreversible; everything logged" | P5 |
| 5b | Why-not section misses the actual category | Add retrieval-brain rebuttal line | P1 |
| 7 | £500 unpackaged | One scope line + experiment log w/ revisit trigger | P3 |
| 8 | Close will age badly | "Now installing in our first roastery" + "we'll share the real results — good or bad" | P3 |
| 9b | 90-sec screen-recording proof | v1 STRETCH (sample data), v1.1 if product env not ready | P2/P3 |
| 10 | Training claim is supply-chain | G2 extended: verify vs Anthropic commercial terms too | P1 |
| 11 | Integrations strip lists unbuilt connectors | G2 extended: strip verified vs BUILT connectors; aspirational → label or cut | P5 |
| 12 | Session-cost realism | 3-session hard cap; Newground delivery outranks site polish | P3/P6 |

## Alternatives (0C-bis, retrofitted per finding 9)
- **A. One long page + /coffee (CHOSEN)** — effort S, risk low; matches plan; nav anchors.
- **B. Multi-route site (about/how/pricing pages)** — effort M; rejected: no traffic to
  justify routes; harder to keep elite everywhere. P3/P5.
- **C. Wait-for-numbers launch** — rejected by Chad (premise 3).

## NOT in scope (deferred → v1.1 list)
Blog · try-it interactive card · HyperFrames launch video/explainers · coffee-first
hierarchy flip · SEO/content engine · screen-recording proof IF product env not ready.

## Dream state
CURRENT: v2 branch, wrong lead story, terracotta skin → THIS PLAN: Dawn one-pager +
/coffee, honest claims, soft+hard CTAs, elite visual bar → 12-MONTH: same spine with
real published client numbers replacing the honest-close, video proof, vertical pages
per arena. Plan moves toward ideal; nothing here is throwaway except the close copy —
by design.

## Phase 1 deep review — 11 sections (static-site scope; auto-decided per P1–P6)

**S1 Architecture** — static HTML/CSS/vanilla-JS, no build step (matches repo DESIGN.md).
```
Visitor ─▶ Vercel CDN ─▶ /  /coffee  /privacy  /404
                      │        │
                      │        ├─ hero raster (AVIF/WebP) + SVG/canvas overlay (progressive)
                      │        ├─ cal.com (plain link, new tab — NOT embedded)
                      │        └─ soft-CTA form ─▶ /api/diagnostic-sample (Vercel fn)
                      │                               └─▶ SMTP email to founders (no DB)
                      └─ Vercel Analytics (cookieless, first-party)
```
Findings→decisions: **A1** soft-CTA backend = tiny Vercel function → email, zero persistence
(email IS the record — proven signing-portal pattern; no new subprocessor). **A5** cal.com as
plain link, not embed (less JS, no third-party iframe). SPOF: cal.com outage → booking section
carries mailto fallback line. Rollback: Vercel instant re-promote previous deployment.
**S2 Error & rescue** — form: network fail/fn error/SMTP fail → inline error + mailto fallback;
double-submit → button disabled in-flight; spam → honeypot + length caps + rate-limit.
Hero raster fail → CSS gradient carries the frame + alt text (by design). JS off /
reduced-motion → static hero fully composed, no content behind JS. Fonts: **A2 self-host
Fraunces + Inter subsets** (kills Google-Fonts GDPR wobble + render flash; system-serif
fallback stack). GAPS: none unrescued.
**S3 Security** — attack surface = the one form endpoint: honeypot, max-length, server-side
validation, rate-limit by IP, no user content echoed into HTML email unescaped. **A3**
security headers in vercel.json (CSP, X-Frame-Options, referrer-policy). SMTP creds =
Vercel env only. **A6 zero runtime npm deps** stays law. No PII stored anywhere.
**S4 Data/interaction edges** — anchor nav on slow load; form states (idle/sending/sent/
error) specified for Phase 2; **A4 redirect map**: /blog/* , /food-and-beverage → /coffee,
/terms.html kept or redirected — full URL inventory at build. OG image per route.
**S5 Code quality** — reuse app.js init/reveal patterns (P4); one styles.css token sheet;
no abstractions beyond need (P5). **S6 Tests** — pre-ship checklist = test-plan artifact
(below). **S7 Performance** — budgets: hero AVIF ≤300KB desktop/≤120KB mobile; fonts
subset+preload; LCP = headline text; canvas rAF pauses off-viewport; Lighthouse ≥95
perf/a11y/SEO mobile = ship gate (**A9**). **S8 Observability** — Vercel Analytics events:
cta_book_click, form_submit, form_error; fn logs for SMTP errors; Vercel 404 report weekly.
**S9 Deployment** — PR units → preview URL → founder eyeball; prod = merge main after
gates; rollback = re-promote. **A7 live send-test of the form before launch**
(agreement-portal standard). **S10 Trajectory** — reversibility 4/5; **A8 DESIGN.md
rewritten for Dawn carrying the honesty rules verbatim**; no framework/dep rot possible.
**S11 Design intentionality** — full treatment in Phase 2 (design voice running).

## Failure modes registry
| Codepath | Failure | Rescued? | Test? | User sees | Logged |
|---|---|---|---|---|---|
| form submit | fn/SMTP error | Y — inline error + mailto | E2E | "email us directly" fallback | Vercel fn |
| form submit | spam flood | Y — honeypot+rate-limit | unit | nothing | fn |
| hero raster | 404/slow | Y — gradient + alt | visual | composed page, no hole | — |
| fonts | blocked/slow | Y — self-host + fallback stack | visual | system serif flash | — |
| canvas overlay | old Safari/JS off | Y — progressive enhancement | manual | static hero | — |
| cal.com | outage | Y — mailto line | manual | alternative contact | — |
| old URLs | 404 after re-skin | Y — redirect map | link-check | right page | Vercel |

CRITICAL GAPS: 0 (all rows rescued + tested).

## What already exists (reuse map)
website-v2 branch: vercel.json scaffold, robots.txt/sitemap.xml (regenerate), privacy.html
(re-skin, keep), app.js init/scroll-reveal/count-up patterns (port), DESIGN.md honesty rules
(carry verbatim into Dawn DESIGN.md), favicon pipeline (replace with spark SVG),
JSON-LD/OG head block (port + update).

# GSTACK AUTOPLAN — Phase 2 (Design) — 2026-07-14 · [subagent-only]

## Design litmus scorecard (independent voice × primary)
| Dimension | Voice | Primary | Consensus |
|---|---|---|---|
| Hierarchy | 7 | 7 | CONFIRMED — spine right; two homeless elements FIXED below |
| States | 2 | 3 | CONFIRMED gap — full form/booking state spec added below |
| Journey | 7 | 8 | CONFIRMED — honesty resequenced, §5 carded |
| Specificity | 5 | 6 | CONFIRMED gap — spec additions below |
| Comp fidelity | 6 | 7 | CONFIRMED — errata + geometry + font-axis lock added |
| Responsive | 6 | 7 | CONFIRMED — drawer + strip reflow + node breakpoints added |
| Accessibility | 6 | 7 | CONFIRMED — a11y contract added |

## Phase 2 spec additions (auto-decided, all P1/P5 — audit rows D-13…D-27)

**Spine placement (fixes "homeless" elements):** founder strip = §7.5, between data-trust
and pricing (trust before the ask). Soft CTA card = after §5 "It acts" (mid-spine
low-commitment step) AND repeated small in the close. Nav = sticky after hero scroll-out,
anchor links (How it works→§3 · Pricing→§8 · For coffee→/coffee · Book button), mobile =
full-screen dawn-gradient drawer, focus-trapped, Esc closes.

**Form spec (states 2/10 → contract):** endpoint per A1 (Vercel fn → founder email;
sample teardown auto-replied by the fn — instant, no list software v1). States: idle /
inline invalid-email ("That email doesn't look right") / sending (button spinner,
disabled) / success (swap: "It's on its way — check your inbox.") / failure ("Something
broke — email us at hello@integrate-ai.uk", mailto). aria-live=polite on status; labelled
input; GDPR line: "We'll send the sample and nothing else. No list, no chasing." cal.com =
new-tab plain link (rel=noopener), decided v1.

**Token/spec additions to §3:** type scale — h2 clamp(1.8rem,4.5vw,2.75rem) serif 380;
lead 1.25rem/1.6; body 1.0625rem/1.75; eyebrow .72rem mono-tracked +.14em uppercase;
label .8rem. `--radius-btn: 14px` (not pill). `--shadow-card: 0 24px 60px -24px
rgb(30 42 69 / .35)`. Glass: backdrop-blur 12px + 1px rgba(255,255,255,.7) border. Grain:
2% opacity, soft-light, 128px tile. Gradients pinned: page = linear-gradient(315deg,
#5E6F8D 0%, #C7CEDA 45%, #F2EDE3 100%); hub glow = radial #FFF4DC→transparent 60%.
Focus ring: 2px `--ink`, offset 2px. Headings: one h1 (hero), sections h2, cards h3.
Selection colour `--glow-core`. Hero paints gradient-first, raster fades in (LQIP-free).

**Comp errata (comps disagree with deck/each other):** integrations strip = the copy-deck
8 incl. Xero; Finance node icon = **£** (mobile comp correct, desktop comp's $ is wrong);
"Mail" item = envelope glyph deliberately (not a brand). Recorded so the build follows the
deck, not the comp, at these three points.

**§5 "It acts" = 4 compact cards** (bold outcome = card title, one sentence each) — kills
the mobile mid-peak sag. **Honesty resequencing:** every product screenshot captioned
"Shown with sample roastery data" at first sight — the close confirms, never reveals.
**§3 proof object:** connector chips with read-only badge (not a second constellation).
**404:** hero gradient + spark + one line + CTA. **Inevitability touches (specced):** CTA
arrow 4px hover nudge · hub glow breathes on node-float easing · strip staggers into the
200ms reveal · selection tinted glow-core.

**Asset-pass additions (→ §6):** node geometry table measured from comps (centres, radii,
label size/tracking, per-breakpoint positions) BEFORE build; Fraunces axis lock
side-by-side vs comp headline (opsz 144, SOFT 0, WONK 0, wght ~340–380) recorded as
tokens — if Fraunces can't match, trial Newsreader/STIX before conceding the face.

# GSTACK AUTOPLAN — Phase 3 (Eng) — 2026-07-14 · [subagent-only]

## Eng consensus (independent voice × primary)
| Dimension | Voice | Primary | Consensus |
|---|---|---|---|
| Architecture sound? | yes, fix stack line | agreed | CONFIRMED — §7 corrected to static+vanilla |
| Test coverage sufficient? | needs enforcement | test-plan artifact | CONFIRMED — budgets now numeric, in artifact |
| Performance risks addressed? | fonts/hero/canvas | agreed | CONFIRMED — self-host, budgets, canvas rules |
| Security threats covered? | CSP rewrite needed | headers planned | CONFIRMED — tight CSP specced below |
| Error paths handled? | form + no-JS gaps | registry existed | CONFIRMED — no-JS + form hardening added |
| Deployment risk manageable? | redirects + canonical | agreed | CONFIRMED — inventory + apex decision below |

## Phase 3 adoptions (auto-decided, audit rows D-28…D-40)
- **Stack corrected** (above). One `/api/diagnostic-sample` function; zero runtime npm deps
  on pages; in the function, provider call via fetch, or `nodemailer` PINNED as the single
  acceptable dep if SMTP (house Gmail-app-password pattern; live send-test mandatory).
  Form = notification-email-only + auto-reply carrying the sample — **no list software, no
  DB, inbox is the record** (mirrors signing portals; GDPR-minimal). Honeypot + min-time-
  on-page (<2s reject) + per-IP rate limit + length caps + no input reflection.
- **/terms KEPT and re-skinned** — indexed legal page; never delete by omission. Footer:
  Privacy · Terms · Contact.
- **Redirect inventory (must not 404):** /food-and-beverage, /food-beverage, /hospitality,
  /restaurants → /coffee (301) · /blog → / (302, may return) · /home /contact /services
  /pricing /how-it-works /results /faq → new anchors (verify anchor IDs exist in new HTML)
  · keep /privacy /terms · preserve /og-image.png path (social caches) + touch icons +
  favicon paths · regenerate sitemap.xml · real 404 page returning 404 status.
- **Canonical decision: apex `https://integrate-ai.uk`** — 308 www→apex; align canonical,
  og:url, sitemap (repo currently inconsistent between og and sitemap).
- **No-JS law:** hidden-until-reveal states gated on `.js` class set by inline html-class
  one-liner; raster + real text = complete page with zero JS. Canvas/shimmer additive only.
- **Canvas contract:** DPR-capped ≤2, viewport-sized only, time-delta motion, paused on
  visibilitychange + offscreen (IO), reduced-motion = static frame + loop killed, listens
  for mid-session media-query change, pointer-events:none, aria-hidden. House rule amended
  consciously: ONE loop allowed (hero canvas), paused when hidden. Budget: a day, device-
  tested, not an hour.
- **CSP (tight):** default-src 'self'; script-src 'self' (boot script moved to file — no
  unsafe-inline for scripts); style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  connect-src 'self'; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; object-src
  'none'; form-action 'self'. Self-hosted fonts + cal.com-as-link keep third-party hosts at
  zero. Keep nosniff/XFO/referrer/permissions/HSTS skeleton from existing vercel.json.
- **Fonts:** self-host subsetted woff2 (pyftsubset retaining opsz/SOFT/wght axes + italic;
  glyph set incl £ · — ' "); preload two critical files; font-display swap; metric-
  compatible fallback (ascent/size-adjust) to kill CLS.
- **Hero delivery:** `<picture>` AVIF→WebP→JPEG, 2 crops × widths, width/height set,
  fetchpriority=high + preload; gradient painted under; encode via checked-in dev script
  (sharp/avifenc — dev tool, not runtime). Edge-colour hand-check at gradient seams incl.
  3440px.
- **Dead code deleted, not carried:** cookie banner/GA4 gate, GA track() shim, qualify-form
  gating, initApprovalLoop/initDashboard/chart/donut/table + demo-data.js (~400 lines).
  KEEP: esc()/trusted-innerHTML pattern, IO reveal, REDUCED plumbing, passive scroll+rAF,
  nav toggle, count-up.
- **Caching:** hand-versioned filenames (styles.v1.css) OR short max-age — no long max-age
  on unhashed assets.
- **OG image:** one-off headless render at exactly 1200×630 (fonts ready), committed static
  at the existing /og-image.png path; absolute URLs on apex.

## Implementation Tasks (aggregated inline — P1 blocks ship)
- [ ] **T1 (P1)** — assets — Node geometry table from comps + Fraunces axis lock side-by-side. Verify: overlay match.
- [ ] **T2 (P1)** — assets — Backdrop plate img2img + 4K upscale → CHAD APPROVES vs comp. Verify: warmth check.
- [ ] **T3 (P1)** — repo — Branch `dawn` off website-v2; delete dead modules; port keep-list; new tokens/styles. Verify: no-JS full render.
- [ ] **T4 (P1)** — pages — `/` per §5 spine (+ founder strip §7.5, soft CTA post-§5, 4 acts cards, sample-data captions). Verify: side-by-side vs comps.
- [ ] **T5 (P1)** — form — `/api/diagnostic-sample` + states + hardening + auto-reply. Verify: live send-test on preview.
- [ ] **T6 (P1)** — infra — vercel.json: CSP, redirects inventory, 404, headers, caching; sitemap; apex canonical. Verify: curl matrix, 0 chains >1 hop.
- [ ] **T7 (P1)** — hero — raster pipeline + canvas overlay per contract. Verify: iOS device, reduced-motion, Low Power.
- [ ] **T8 (P2)** — `/coffee` re-led page + strip-honesty pass vs built connectors. Verify: G1/G2 gate table.
- [ ] **T9 (P2)** — /privacy + /terms re-skin; footer legal-entity line. Verify: links live.
- [ ] **T10 (P2)** — OG image render + JSON-LD/meta port; Vercel Analytics events. Verify: scraper preview + beacon fires.
- [ ] **T11 (P1, gate)** — full test-plan artifact run (Lighthouse ≥95/100/100, axe, crawl, matrix). Verify: results in PR.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_resolved | 12 findings (2 crit) → premises confirmed, 10 auto-fixes, 1 user challenge ACCEPTED, 2 taste decided |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | SKIPPED | founder rule: all-Claude ([subagent-only] voices used) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_resolved | 29 findings (1 crit stack fix) → all adopted; test-plan artifact written |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_resolved | 23 findings; states 2/10 → full contract; geometry+font tasks gate the build |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | SKIPPED | no developer-facing scope (grep hits were "client" substrings) |

- **CROSS-MODEL:** n/a (single-model by founder rule); three independent Claude voices used, one per phase.
- **CROSS-PHASE THEMES:** honesty-vs-claims (CEO capability framing ∥ design sample-data captions ∥ eng strip-verification) — highest-confidence signal, now enforced in three layers. Form backend under-specification flagged by all three voices independently — closed as A1.
- **UNRESOLVED:** 0. All 64 findings decided (4 by Chad at the premise gate, 60 auto-decided and logged).
- **VERDICT:** CEO + DESIGN + ENG CLEARED — ready to implement. Ship gates: G1 consent · G2 claims verification · G3 sitemap hygiene · T11 test-plan run.
