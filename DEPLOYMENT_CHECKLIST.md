# DCZ WebAudit v4 deployment checklist

## Release gates

- [ ] Node.js 22.x and npm 10.9.4.
- [ ] `node scripts/verify-lockfile.mjs` passes.
- [ ] Clean `npm ci --include=dev --no-audit --no-fund` passes.
- [ ] Workspace verification passes.
- [ ] `npm audit --omit=dev --audit-level=high` passes.
- [ ] ESLint, strict TypeScript, Vitest, and `next build` pass.
- [ ] Strict staged-release verification passes.
- [ ] Manifest, ZIP, and SHA-256 are generated and verified.
- [ ] GitHub Actions is green for the exact deployment commit.
- [ ] Exact deployed commit SHA and build timestamp are recorded; no uncommitted workspace is deployed.

## Git and secrets

- [ ] Remote history was fetched and inspected before the first push.
- [ ] No force push or unrelated-history overwrite.
- [ ] Staged diff was reviewed.
- [ ] `package-lock.json` is committed.
- [ ] No `.env*`, credentials, generated directories, logs, editor caches, or release archives are tracked.

## Database

- [ ] Disposable database migration test passes from empty state.
- [ ] Runtime schema matches migrations `0000` through `0004`.
- [ ] Existing migration checksums are unchanged.
- [ ] Neon pre-production branch/backup exists.
- [ ] Production migration is run manually and recorded.
- [ ] Follow-up lease/claim concurrency is verified.

## Hostinger

- [ ] Next.js server-side application, Node 22, root `.`.
- [ ] Install uses `npm ci --include=dev --no-audit --no-fund`.
- [ ] Build uses `npm run build`; start uses `npm run start`.
- [ ] Every required environment variable is configured in hPanel.
- [ ] A new independent `FUNNEL_SESSION_SECRET` (minimum 32 bytes) is configured before deploying the session code.
- [ ] Staging is noindex; production uses the final HTTPS URL.
- [ ] `/api/health` returns 200 after deployment.
- [ ] Hostinger proxy timeout supports the audit deadline.
- [ ] Purge and follow-up POST cron jobs return success with the bearer secret and 401 without it.

## Connected services

- [ ] Neon TLS connection works.
- [ ] Resend sender domain, SPF, DKIM, and DMARC are reviewed.
- [ ] Turnstile is enabled and verified in production.
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` was present during the exact production build (public value only; record at most its final eight characters).
- [ ] Cloudflare Turnstile hostname allowlist contains the canonical production hostname and intentional staging hostname only.
- [ ] Siteverify enforces the exact canonical hostname and action matrix: `audit_start`, `audit_unlock`, `audit_resend`, `manual_review`, `admin_login`.
- [ ] HCDN/proxy does not cache, rewrite, block, or defer `https://challenges.cloudflare.com/turnstile/v0/api.js`; CSP permits the Turnstile script/frame/connect origins.
- [ ] Funnel cookie is HttpOnly, Secure, SameSite=Lax, Path=/ and expires after 25 minutes.
- [ ] Monitoring webhook receives a redacted test event.
- [ ] Booking URL and webhook/manual fallback work.

## Funnel and security

- [ ] URL → progress → Executive Preview → Money Leak Map.
- [ ] E-mail unlock → POST confirmation → full report.
- [ ] Turnstile loading/error/expiry/timeout recovery works without automatic resubmission or duplicate widgets.
- [ ] Atomic resend cooldown permits one concurrent sender and uses the claimed timestamp as provider idempotency input.
- [ ] Magic-link POST validates the audit before consumption, then atomically consumes the token and verifies the audit-bound lead.
- [ ] ROI → three qualification questions → contextual offer → case study.
- [ ] Booking → Opportunity Brief → admin routing.
- [ ] Fit/Intent scoring and Priority A notification.
- [ ] Follow-up retry, booking/contact stop, consent, and unsubscribe.
- [ ] SSRF, origin, rate-limit, noindex/no-store, CSP, and raw-error checks.
- [ ] Mobile, keyboard, focus, reduced motion, overflow, and contrast.

## Rollback

- [ ] Previous green commit and ZIP/hash retained.
- [ ] Pre-migration Neon branch/backup retained.
- [ ] Application and database rollback steps rehearsed.
- [ ] Production soft launch is approved only after the staging matrix passes.
