# Aloud website

Landing page for Aloud with an early-access form. Static HTML/CSS/JS on Cloudflare Pages; the form posts to a Pages Function that stores the email in D1 and sends a thank-you mail via Resend.

```
public/                         the site (index.html, styles.css, main.js)
functions/api/early-access.js   POST /api/early-access
migrations/                     D1 schema
test/                           endpoint tests (node --test)
```

## Run locally
```sh
npm install
cp .dev.vars.example .dev.vars        # put your RESEND_API_KEY in it
npm run db:migrate:local
npm run dev                           # http://localhost:8788
npm test
```
See stored emails: `npx wrangler d1 execute aloud-early-access --local --command "SELECT * FROM early_access"`

> The thank-you mail is sent from `support@aloudedu.com` (set in `wrangler.toml`). It only delivers once `aloudedu.com` is verified in Resend; until then signups are still stored and the send error is logged.

## Deploy
Production: Cloudflare Pages project `aloud-website` → https://aloud-website-9e1.pages.dev (custom domain `www.aloudedu.com`). D1 database `aloud-early-access` is already created and migrated.

```sh
npx wrangler login     # once per machine
npm run deploy         # deploys public/ + functions/ to production
```
The Resend key is a Pages secret: `npx wrangler pages secret put RESEND_API_KEY --project-name aloud-website` (redeploy after changing it).

## Domain: aloudedu.com
1. **Email sending:** in Resend → Domains, add `aloudedu.com` and add the DNS records it shows (SPF, DKIM, and optionally DMARC) at your DNS provider. Wait for "Verified".
2. **Website:** DNS stays at Network Solutions. In the Pages project → Custom domains, add `www.aloudedu.com`; at Network Solutions add a CNAME `www` → `aloud-website-9e1.pages.dev`, and forward `aloudedu.com` to `https://www.aloudedu.com`.
3. Sender, reply-to and the site's contact address are all `support@aloudedu.com`. To change them, edit `wrangler.toml` and the footers of the three pages in `public/`.

See stored emails in production: `npx wrangler d1 execute aloud-early-access --remote --command "SELECT email, created_at FROM early_access ORDER BY id DESC"`
