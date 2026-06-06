# IntegrateAI Website (v2)

The public marketing site for **IntegrateAI Advisors**, served at
[www.integrate-ai.uk](https://www.integrate-ai.uk).

## Stack

Deliberately boring and dependency-free:

- **Hand-written static HTML, CSS, and vanilla JavaScript.** No framework, no
  library, no build step. Files are served exactly as they sit in this repo.
- **Hosted on Vercel** as a static deployment. There is no server runtime — every
  route maps to a file on disk.
- **Google Fonts** (DM Serif Display, Inter, JetBrains Mono) loaded from
  `fonts.googleapis.com` / `fonts.gstatic.com`.
- **GA4** analytics (`G-RT7VN5KQHC`) loaded from `googletagmanager.com`.
- **Cal.com** for booking (linked, with the embed hosts allow-listed in the CSP
  so a future inline embed will work without a config change).

If you reach for npm, a bundler, or a JS framework, stop — that is out of scope
for this site by design. A page should be openable with `file://` and still
render.

## File layout

```
website-v2/
├── index.html                 # Homepage
├── food-and-beverage/
│   └── index.html             # Sector landing page → served at /food-and-beverage
├── privacy.html               # Privacy policy → served at /privacy
├── terms.html                 # Terms → served at /terms
├── blog/
│   └── index.html             # Blog index → served at /blog
├── assets/
│   ├── styles.css             # Shared styles (used by sector/sub-pages)
│   ├── app.js                 # Shared behaviour (scroll-reveal, count-ups, form)
│   └── demo-data.js           # Sample data for the labelled demo widgets
├── favicon.ico / favicon.png
├── apple-touch-icon.png
├── og-image.png               # Open Graph / Twitter card image
├── vercel.json                # Clean URLs, redirects, security headers (CSP etc.)
├── robots.txt                 # Allow all + sitemap pointer
├── sitemap.xml                # Homepage, /food-and-beverage, /privacy, /terms
├── DESIGN.md                  # Locked design tokens for this site
└── archive/                   # Previous versions, kept for reference only
```

## Routing & redirects

Routing is handled entirely by `vercel.json`:

- **`cleanUrls: true`** — `.html` is stripped from URLs. `privacy.html` is served
  at `/privacy`, `terms.html` at `/terms`, and the `food-and-beverage/index.html`
  directory is served at `/food-and-beverage`.
- **Redirects** preserve old top-level paths from the previous site so nothing
  404s: legacy section paths (`/services`, `/pricing`, `/contact`, `/faq`,
  `/how-it-works`, `/results`) redirect to the matching homepage anchor, and a few
  sector aliases (`/food-beverage`, `/hospitality`, `/restaurants`) redirect to
  `/food-and-beverage`.
- **Security headers** are applied to every route: a CSP that allows Google Fonts,
  GA4, and Cal.com only; plus `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS.

If you add a page, add it to `sitemap.xml` and (if it replaces an old URL) add a
redirect in `vercel.json`.

## Build pipeline

This site is built and shipped through **gstack** — the same disciplined pipeline
used across IntegrateAI. Plan → design → build → review → ship → land → monitor.
Do not scaffold, restyle, or land changes ad-hoc. In particular:

- Design/visual changes go through `/design-consultation` against `DESIGN.md`
  (tokens are locked).
- Pre-landing review is `/review`; security review is `/security-review` or `/cso`.
- Shipping and deploying go through `/ship` then `/land-and-deploy`.

`DESIGN.md` in this repo is the single source of truth for fonts, colour, spacing,
and motion. Brand tokens are locked — deviations need founder sign-off.

## Local preview

No build step. Serve the folder with any static server, e.g.:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Note: `cleanUrls` and redirects are a Vercel behaviour and will not apply under a
plain local server — use `vercel dev` if you need to exercise those exactly.
