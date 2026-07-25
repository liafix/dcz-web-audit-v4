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
TURNSTILE_ENABLED=false
```

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
2. Confirm security headers, private-route noindex/no-store behavior, and `/robots.txt`.
3. Connect `dczweb.com`, enable SSL, and preserve unrelated mail DNS records.
4. Set the final HTTPS application URL and redeploy.
5. Set indexing prevention to false only after final production smoke testing.

## Health and logs

- Probe `GET /api/health` after every deployment.
- A healthy production response is HTTP 200 with database and configuration `ok`.
- Missing configuration or database failure returns HTTP 503 without exposing secret values.
- Use Hostinger deployment/runtime logs and the configured HTTPS monitoring webhook.
- Application error messages, stack output, e-mail addresses, credentials, tokens, and query
  strings are redacted or bounded before logging.

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
