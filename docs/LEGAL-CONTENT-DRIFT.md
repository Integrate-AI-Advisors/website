# Legal content drift — privacy & terms

**Status:** RESOLVED 2026-07-15 · Chad signed off the redraft (controller = Integrate AI Advisors Ltd, site stays analytics-free) and it is applied to `privacy.html` / `terms.html`. Kept for the record.
**Raised:** 2026-07-14, during the Dawn re-skin of `privacy.html` / `terms.html` (WS-13, queue item 2).

## What happened

The re-skin changed **design only** — every sentence of legal copy was carried across
verbatim, as briefed. But re-reading that copy against the Dawn build shows the policy
now **describes a website that no longer exists**. This is a factual-accuracy problem on
a legal page, not a design one, so it is logged rather than silently "fixed": rewriting a
privacy policy is a founder/legal call, not an autonomous one.

Nothing here is deployed — `dawn` is a branch, ship is founder-gated — so there is no
live falsehood today. It must be resolved before the branch goes to production.

## The drift, precisely

What the Dawn site **actually** does:
- Collects **one field: an email address** (plus an invisible honeypot), via the soft-CTA
  form → `api/diagnostic-sample.js`, which emails the visitor a sample diagnostic PDF and
  notifies the founders. SMTP is Gmail (`SMTP_USER`/`SMTP_PASS`).
- Loads **no analytics, sets no cookies, shows no consent banner**. There is no GA4 on any
  Dawn page (`grep gtag` returns nothing).
- Links out to Cal.com for booking — a plain link, no qualification or routing logic.

| # | Where | What it claims | Reality |
|---|-------|----------------|---------|
| 1 | privacy §2 | A "qualification form" collecting company name, website, revenue band, tools checklist, role | Gone. Email only. |
| 2 | privacy §2, §3, §5, §6, §8 | Google Analytics 4 (ID `G-RT7VN5KQHC`), a cookie-consent banner, an Accept/Decline choice, a stored consent preference | None of it exists. No analytics, no cookies. |
| 3 | privacy hero lead | "we never load tracking until you say yes" | Now vacuously true, but implies a banner the visitor will never see. |
| 4 | privacy §7 | "When the form determines we may be a fit, it sends you to our booking page" | No qualification step. Cal.com is a direct link. |
| 5 | privacy §2, §6 | — | **Missing entirely:** the sample-diagnostic email flow. Needs a processing description and a sub-processor entry for the SMTP provider (Gmail/Google). |
| 6 | privacy callout + terms intro | Controller/contracting party is "a partnership operated by Chad Pickard and Paul Robinson" | The footer now says **Integrate AI Advisors Ltd, company no. 17134367**. A partnership and a limited company are different legal persons. If the Ltd is the controller, both documents are naming the wrong entity. |
| 7 | both, header | "Last updated: 6 June 2026" | Must be bumped when the above are settled. |

## Decisions needed from a founder

1. **Which entity is the data controller and the contracting party** — the Ltd, or the
   partnership? Item 6 cannot be drafted without this, and it is the one with real legal
   weight.
2. **Is the site staying analytics-free?** If yes, the GA4/cookie sections should be cut
   and replaced with a short, honest "we set no cookies and run no analytics" statement —
   which is a genuinely strong trust signal and worth saying plainly. If GA4 is coming
   back, the consent banner has to come back with it before the copy is true again.
3. **Sign-off on a redraft** of privacy §2/§3/§5/§6/§7 to describe the email-only flow.

Once 1–3 are answered, the redraft is quick. Ask the session to draft it; do not ship the
current text.
