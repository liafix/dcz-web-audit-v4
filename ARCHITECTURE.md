# Architecture — DCZ WebAudit Revenue Diagnostic v4

## Runtime

- Next.js 15 App Router, Node.js 22 runtime
- PostgreSQL/Neon + Drizzle ORM
- Resend transactional e-mail
- Cloudflare Turnstile
- optional Google PageSpeed API
- primary target: Hostinger Node.js Web App from GitHub `main`

## Core domains

```text
src/lib/audit            evidence collection, rules, scoring and report
src/lib/security         SSRF, tokens, origin checks, Turnstile
src/lib/revenue          business profile, Executive Summary, Money Leaks, ROI
src/lib/solutions        contextual DCZ solution selection
src/lib/case-studies     proof matching
src/lib/leads            Fit/Intent scoring and routing
src/lib/follow-up        eligibility, scheduling and delivery
src/lib/db               persistent queries and retention
src/components/revenue   high-end funnel UI
```

## Trust boundary

User-provided URLs are untrusted. The server validates protocol, hostname, ports, all DNS results and every redirect. Requests are IP-pinned and body/time limited. Public input is Zod-validated, body-limited, rate-limited and same-origin checked where applicable.

## Funnel states

```text
URL → audit processing → partial report → pending lead → e-mail confirmation
→ full report → ROI → qualification → recommendation → proof → booking/brief
→ scoring/routing → follow-up
```

Analytics and notifications are best-effort and must not revert a completed business operation.

## Financial claims

The audit does not invent monetary loss. ROI appears only after user-supplied inputs and always includes assumptions and a disclaimer.

## Private surfaces

`/audit`, `/access`, `/brief`, `/book`, `/admin`, `/unsubscribe` and `/api` are noindex; sensitive responses use `Cache-Control: no-store`.
