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

## Deploy (first time)
1. `npx wrangler login`
2. `npx wrangler d1 create aloud-early-access` and paste the `database_id` into `wrangler.toml`.
3. `npm run db:migrate:remote`
4. In the Cloudflare dashboard: Workers & Pages → Create → Pages → connect this GitHub repo. Build command: none. Output directory: `public`.
5. In the Pages project settings, add the secret `RESEND_API_KEY` (and bind D1 as `DB` if it isn't picked up from `wrangler.toml`).

## Domain: aloudedu.com
1. **Email sending:** in Resend → Domains, add `aloudedu.com` and add the DNS records it shows (SPF, DKIM, and optionally DMARC) at your DNS provider. Wait for "Verified".
2. **Website:** in the Cloudflare Pages project → Custom domains, add `aloudedu.com` and `www.aloudedu.com`.
3. Sender, reply-to and the site's contact address are all `support@aloudedu.com`. To change them, edit `wrangler.toml` and the footers of the three pages in `public/`.

See stored emails in production: `npx wrangler d1 execute aloud-early-access --remote --command "SELECT email, created_at FROM early_access ORDER BY id DESC"`
