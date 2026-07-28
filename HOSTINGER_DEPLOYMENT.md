# Hostinger Node.js Web App deployment

This application is deployed from the GitHub `main` branch as a persistent Next.js server.
It does not require a Vercel runtime. `vercel.json` is retained only as optional cross-platform
metadata; Hostinger cron jobs must be configured separately.

## Required platform settings

```text
Framework: Next.js (server-side)
Node.js: 22
Root directory: .
Install command: npm ci --include=dev --no-audit --no-fund
Build command: npm run build
Start command: npm run start
```

Confirm these exact commands in the Hostinger deployment log. A production build needs the
development dependencies that contain TypeScript, Tailwind, and the Next.js build toolchain.

## Safe GitHub deployment

1. Deploy only a GitHub commit with a green CI run.
2. Confirm `package-lock.json` is committed.
3. Confirm `.env*`, `node_modules`, `.next`, coverage, logs, editor caches, ZIPs, and secrets are
   not tracked.
4. Connect Hostinger to the intended repository and `main`.
5. Start on the temporary Hostinger domain with indexing prevention enabled.

## Environment variables

Staging:

```env
NEXT_PUBLIC_APP_URL=https://temporary-hostinger-domain.example
NEXT_PUBLIC_PREVENT_INDEXING=true
TURNSTILE_ENABLED=true
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<staging-site-key>
```

Set `TURNSTILE_SECRET_KEY` to the staging-only Turnstile secret and
`FUNNEL_SESSION_SECRET` to an independent random value of at least 32 bytes in the
Hostinger environment-variable UI. Do not place either value in this file.

Production:

```env
NEXT_PUBLIC_APP_URL=https://dczweb.com
NEXT_PUBLIC_PREVENT_INDEXING=false
TURNSTILE_ENABLED=true
```

Set every applicable key from `.env.example` in hPanel. In live production this includes:

```text
DATABASE_URL
RESEND_API_KEY
MAIL_FROM
DCZ_NOTIFICATION_EMAIL
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
FUNNEL_SESSION_SECRET
REQUEST_FINGERPRINT_SECRET
ACCESS_COOKIE_SECRET
ADMIN_SESSION_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
CRON_SECRET
MONITORING_WEBHOOK_URL
DIAGNOSTIC_BOOKING_URL
BOOKING_WEBHOOK_SECRET
```

The HMAC, session, cron, Turnstile, and booking secrets must be independent random values of at
least 32 bytes. Production URLs must use HTTPS. Never commit or place secret values in logs,
issues, documentation, or release ZIPs. Public `NEXT_PUBLIC_*` variables are embedded at build
time, so changing them requires redeployment.

For Turnstile, the build and runtime configuration must agree:

- build with the intended `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; changing it in hPanel without rebuilding is insufficient,
- keep `TURNSTILE_ENABLED=true` and the matching secret at runtime,
- bind Cloudflare to the canonical hostname (plus an intentional staging hostname where applicable),
- preserve the form action matrix `audit_start`, `audit_unlock`, `audit_resend`, `manual_review`, and `admin_login`,
- do not cache or transform the Cloudflare Turnstile script through HCDN, and keep CSP access to Cloudflare script, frame, and verification endpoints,
- record the exact deployed commit SHA, build time, hostname, and only a non-sensitive Site Key suffix in the QA evidence.

## Database migration

The application does not migrate the database during startup.

1. Create a Neon branch or backup.
2. Apply migrations to a staging branch:

   ```powershell
   npm run db:migrate
   ```

3. Run connected staging QA.
4. Apply the same immutable migration files to production.
5. Record the database branch and deployed commit SHA.

The migration runner validates checksums, serializes migration work with a PostgreSQL advisory
transaction lock, and applies each migration file atomically.

## Hostinger cron jobs

`vercel.json` cron declarations are not executed by Hostinger. Add custom UTC cron jobs in hPanel.

Daily purge at 03:00 UTC:

```bash
curl -fsS --max-time 90 -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://dczweb.com/api/cron/purge
```

Follow-up processing every 30 minutes:

```bash
curl -fsS --max-time 90 -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://dczweb.com/api/cron/follow-ups
```

Test both commands against staging. A missing or incorrect bearer secret must return HTTP 401.
Review cron output after activation. Follow-up jobs use leased PostgreSQL claims so overlapping
runs cannot claim the same job.

## Domain, HTTPS, and indexing

1. Test the temporary domain with `NEXT_PUBLIC_PREVENT_INDEXING=true`.
2. Confirm the staging responses do not emit a canonical URL or production `og:url`, every page
   has `noindex,nofollow`, `X-Robots-Tag` is present, `/robots.txt` contains `Disallow: /` without a
   sitemap declaration, and `/sitemap.xml` is empty.
3. Confirm security headers and private-route noindex/no-store behavior remain intact.
4. Connect only the canonical host `dczweb.com`, enable SSL, and preserve unrelated mail DNS
   records. Configure `www.dczweb.com` and any legacy application hostname as permanent redirects
   to the same path on `https://dczweb.com`; do not serve duplicate indexable copies.
5. Set `NEXT_PUBLIC_APP_URL=https://dczweb.com`, keep indexing prevention enabled, and redeploy.
6. Smoke-test the production hostname before changing the indexing flag. Check `/`,
   `/methodology`, `/privacy`, `/contact`, `/robots.txt`, and `/sitemap.xml`; confirm HTTPS, the
   preferred host, canonical URLs, Open Graph URLs, crawler directives, and redirects.
7. Set indexing prevention to false only after that smoke test, then redeploy once more.
8. Verify the live indexable set is exactly `/`, `/methodology`, `/privacy`, and `/contact`.
   Case studies remain outside the sitemap and carry `noindex,follow` until an explicit editorial
   publication decision is recorded.

These are manual hPanel, DNS, and live-site actions. This repository change does not modify
Hostinger, DNS, Search Console, analytics, or any other external system.

## Health and logs

- Probe `GET /api/health` after every deployment.
- A healthy production response is HTTP 200 with database and configuration `ok`.
- Missing configuration or database failure returns HTTP 503 without exposing secret values.
- Use Hostinger deployment/runtime logs and the configured HTTPS monitoring webhook.
- Application error messages, stack output, e-mail addresses, credentials, tokens, and query
  strings are redacted or bounded before logging.
- Siteverify diagnostics may retain only bounded status, sanitized error codes, returned
  hostname/action, and the mismatch classification. Never log the response token, secret, or
  raw upstream body.

## Turnstile and funnel smoke test

After every staging or production build:

1. Exercise audit start, expired-session unlock fallback, resend, manual review, and admin login.
2. Confirm each form renders one widget, keeps it across unrelated React re-renders, and never
   submits automatically after a token or recovery.
3. Simulate blocked script, script error, expiry, timeout, and offline submission. The UI must
   distinguish loading/interaction/recovery states and permit a guarded re-render.
4. Confirm a submitted token is cleared before the request and cannot be reused after any
   response or network ambiguity.
5. Confirm Siteverify rejects a deliberately wrong hostname/action in staging test fixtures.
6. Run two concurrent unlock and resend attempts: only one access token and one e-mail attempt
   may be produced for each atomic delivery claim.
7. Confirm magic-link GET is inert, POST confirmation is one-time, and downstream routing or
   notification failure cannot revoke the confirmed report cookie.
8. Confirm a rejected `/process` request shows a warning without an unhandled promise, while
   status polling and bounded retry remain operational.

## Audit timeout validation

The audit has an application deadline of 50 seconds and a 90-second processing lease. Next.js
`maxDuration` metadata does not enforce a timeout on self-hosted Hostinger. Measure the actual
Hostinger reverse-proxy timeout during staging. Do not launch if requests are terminated before
the application deadline or stale retry behavior loses audits.

## Rollback

Keep the previous green commit, release ZIP/checksum, environment configuration, and pre-migration
Neon branch. Redeploy the previous commit without force-pushing. If an incompatible database
change is involved, restore/promote the pre-migration Neon branch and then verify health, audit,
e-mail, booking, admin, and cron behavior.
