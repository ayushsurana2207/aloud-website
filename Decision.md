# Decisions

## 2026-11-01 — Static HTML/CSS/JS, no framework
**Decision:** Hand-convert the "01 · Website" artboard from the Sounding prototype (Claude Design canvas) into one `public/index.html` + `styles.css` + `main.js`.
**Why:** It's a single landing page with one form. No build step means nothing to break and instant loads.
**Alternatives considered:** Next.js/Astro — adds a build pipeline and dependencies for no gain on one page. Exporting the `.dc.html` as-is — it depends on the prototype tool's runtime and can't be served standalone.

## 2026-11-01 — Cloudflare Pages + Pages Functions + D1
**Decision:** Host on Cloudflare Pages; `functions/api/early-access.js` handles the form; emails are stored in D1 table `early_access`.
**Why:** Free plan with unlimited bandwidth and commercial use, database included, and the same stack as `gtm-copilot`, so one provider to manage.
**Alternatives considered:** Vercel — Hobby plan is non-commercial and needs a separate database (Neon/Supabase). Netlify — also needs a separate database.

## 2026-11-01 — Resend for the thank-you email, called via fetch
**Decision:** Send the thank-you mail through Resend's REST API with plain `fetch` (no SDK).
**Why:** Simplest transactional email API, free tier of 3,000/month, and fetch avoids a dependency.
**Alternatives considered:** SendGrid/Postmark — heavier setup; MailChannels — free Workers integration ended.

## 2026-11-01 — Store first, mail once
**Decision:** Insert with `ON CONFLICT(email) DO NOTHING`; only a newly inserted email gets a thank-you mail; a mail failure is logged but the request still succeeds.
**Why:** No signup is ever lost to an email-provider outage, and the form can't be used to repeatedly mail someone's inbox.
**Alternatives considered:** Mailing on every submit — abusable. Failing the request when mail fails — loses signups.

## 2026-11-01 — Honeypot instead of CAPTCHA
**Decision:** A hidden `website` field; submissions that fill it get a fake success and are not stored.
**Why:** Stops simple bots with zero friction for professors.
**Alternatives considered:** Cloudflare Turnstile — add it if spam appears.

## 2026-11-01 — Wrangler 3.x pinned
**Decision:** Pin `wrangler@3.114.17`.
**Why:** Wrangler 4 needs Node 22; the dev machine has Node 20. Upgrade to Wrangler 4 after upgrading Node.
**Alternatives considered:** Upgrading system Node — not done without the owner's go-ahead.

## 2026-11-01 — Privacy Policy and Terms of Use pages
**Decision:** Add static `public/privacy.html` and `public/terms.html` in the site's design, written to match what the site actually does (email + user agent stored in D1, Resend for mail, Google Fonts, no cookies or analytics). The popup links to both; legal-page CTAs link to `/#access`, which opens the form on the home page.
**Why:** The site collects emails, so it needs a privacy policy before launch. Describing only real data flows keeps the policy accurate.
**Alternatives considered:** Generated boilerplate from a policy generator — generic and lists practices we don't have. Not lawyer-reviewed; no governing-law clause until the company's legal entity and jurisdiction are set.
