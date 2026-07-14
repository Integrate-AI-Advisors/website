# Privacy + terms redraft — for founder approval

**Status:** DRAFT · not applied to the live pages · awaiting Chad's sign-off
**Written:** 2026-07-14 · pairs with [LEGAL-CONTENT-DRIFT.md](LEGAL-CONTENT-DRIFT.md)

This is proposed replacement copy, drafted so it accurately describes what the Dawn
build actually does. It is **not** applied to `privacy.html` / `terms.html` — say the
word and the next run drops it in. Not legal advice; worth a solicitor's eye before
it goes live, especially the controller identity.

---

## ONE THING I NEED FROM YOU

**Is Integrate AI Advisors Ltd (company no. 17134367) now the trading entity and the
data controller — replacing the Chad/Paul partnership?**

The footer already says the Ltd. The policy and the terms both still say "a partnership
operated by Chad Pickard and Paul Robinson". Those are different legal persons and they
can't both be the controller. **I've drafted below assuming the Ltd.** If that's wrong,
tell me and I'll flip it back.

Everything else below is settled by what the code does, not by preference.

---

## What the site actually does (the basis for this draft)

- **Collects one field: an email address.** The soft-CTA form posts to
  `api/diagnostic-sample.js`, which emails the visitor a sample diagnostic PDF and sends
  the founders a notification. There is an invisible honeypot field for spam; genuine
  visitors never fill it.
- **No analytics. No cookies. No consent banner.** No GA4 on any page.
- **Cal.com** is a plain outbound link for booking a diagnostic.
- **Vercel** hosts the site and keeps short-lived server logs.
- **Gmail (Google)** carries the outbound sample email — a new sub-processor the current
  policy doesn't mention at all.

---

## PRIVACY — proposed changes

### Controller callout (replaces "Who we are")

> **Who we are.** IntegrateAI ("we", "us", "our") is the trading name of **Integrate AI
> Advisors Ltd**, a company registered in England and Wales (company no. 17134367), based
> in Milton-under-Wychwood, Oxfordshire.
>
> We are the **data controller** for personal data collected through this website. Any
> question about this policy or your data: <hello@integrate-ai.uk>.

### Hero lead (replaces "…we never load tracking until you say yes")

> We ask for one thing — your email address — and only if you want the sample diagnostic.
> We run no analytics and set no cookies. This explains the detail.

### §2 What data we collect (replaces the qualification-form section)

> **Information you give us.** If you ask us to send you the sample diagnostic, we collect
> the one field the form asks for: **your email address**. That's it — no company details,
> no revenue figures, no tool checklist.
>
> The form also has a hidden "honeypot" field, invisible to people and only completed by
> automated spam tools. If it's filled in, we discard the submission. No genuine visitor
> data is collected by it.
>
> If you email us directly, or book a call, we hold whatever you choose to put in that
> email or booking.
>
> **Information we collect automatically.** Our host (Vercel) keeps basic server logs,
> including IP addresses, as a necessary part of serving and protecting the site. They are
> short-lived and used only for security and reliability. **We collect nothing else.**

### §3 Cookies & analytics (replaces the whole GA4 / consent-banner section)

This is the section that changes most — and it's a straight upgrade as a trust signal.
Say it plainly rather than burying it:

> **We set no cookies and we run no analytics.**
>
> No Google Analytics, no tracking pixels, no advertising tags, no third-party scripts of
> any kind. We don't measure you, and we don't build a profile of you. That's why you'll
> never see a cookie banner on this site — there's nothing to consent to.
>
> If that ever changes, we'll ask for your consent first, and this page will say so before
> anything loads.

> **Note for Chad:** this is only true while it stays true. If GA4 (or any pixel) goes back
> on the site, this section has to be rewritten and a consent banner has to come back with
> it — PECR requires consent *before* non-essential cookies load. Don't let a marketing tag
> get added without this page changing in the same PR.

### §5 Lawful basis (replaces the table)

| What | Lawful basis |
|---|---|
| Sending you the sample diagnostic you asked for | **Legitimate interests** (Art. 6(1)(f)) — acting on a request you made. You can object at any time. |
| Replying to emails you send us | **Legitimate interests** (Art. 6(1)(f)) — answering correspondence you started. |
| Arranging a diagnostic call you booked | **Legitimate interests** (Art. 6(1)(f)) — a request you initiated. |
| Keeping records for tax, accounting or legal reasons | **Legal obligation** (Art. 6(1)(c)). |
| Securing and maintaining the website (server logs) | **Legitimate interests** (Art. 6(1)(f)) — protecting the site and its visitors. |

The "Analytics cookies — Consent" row is **deleted**. There is no consent processing left.

### §6 Who we share your data with (replaces the table)

| Provider | What they handle |
|---|---|
| **Google (Gmail)** | Carries the sample-diagnostic email we send you, and the notification to us. Your email address passes through Gmail. |
| **Cal.com** | Our booking platform. If you book a diagnostic call, the name, email and time you enter there are processed by Cal.com. |
| **Google (Calendar)** | A booked call creates a calendar event and confirmation emails. |
| **Vercel** | Hosts the site and keeps short-lived server logs. |

Google Analytics is removed from this table. **Gmail is added** — it's currently missing
entirely, which is the one genuine gap in the existing policy rather than just staleness.

### §7 Booking your call

Delete "When the form determines we may be a fit, it sends you to our booking page" — there
is no qualification step now. Replace with:

> If you book a diagnostic call, you'll do it on our booking page, powered by **Cal.com**.
> The name, email and time you enter there are processed by Cal.com on our behalf, and the
> resulting calendar invite and confirmation emails are handled by **Google**.

### §8 Retention

Delete the "Analytics data — 14 months" bullet. Add:

> **Your email address, if you requested the sample:** kept while we're in contact and for
> up to 24 months after our last exchange, then deleted. We don't add you to a mailing list.

### Header

Bump **Last updated** to the date this goes live.

---

## TERMS — proposed change

One change only. The intro currently reads "…by **IntegrateAI Advisors** — a partnership
operated by Chad Pickard and Paul Robinson…". If the Ltd is the contracting party:

> These Terms of Service ("Terms") govern the provision of AI consultancy, implementation
> and advisory services ("Services") by **Integrate AI Advisors Ltd**, a company registered
> in England and Wales (company no. 17134367), based in Milton-under-Wychwood, Oxfordshire
> ("we", "us", "our"), to you ("Client", "you", "your"). By engaging our Services, you agree
> to these Terms in full.

Also check §6 Indemnification, which says "IntegrateAI Advisors, its partners and
contractors" — "partners" reads as partnership language. If it's a Ltd, that should be
"its directors, employees and contractors".

The rest of the terms are engagement terms and don't depend on what the website does — they
survive the Dawn rebuild unchanged.
