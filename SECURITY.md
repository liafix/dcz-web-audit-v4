# Security

## URL/SSRF controls

The audit accepts only HTTP/HTTPS on ports 80/443, rejects credentials and internal suffixes, validates every A/AAAA result, rejects mixed public/private DNS, pins outbound requests to validated IPs, revalidates redirects and applies time/content-type/body limits.

## Application controls

- Zod validation and body limits
- same-origin checks for state-changing browser requests
- Turnstile fail-closed in public production
- IP/subject rate limits
- HttpOnly/Secure/SameSite cookies
- hash-only report, brief and unsubscribe tokens
- CSP, HSTS, no-store and noindex headers
- admin rate limiting and signed session
- redacted structured logs and correlation IDs

## High-end funnel controls

- ROI values are never placed in public URLs.
- booking uses a GET confirmation followed by POST to prevent scanner side effects.
- case studies have explicit proof types.
- service follow-ups and marketing consent are evaluated separately.
- booking/contact/won/lost stages stop automated follow-up.
- Priority A notifications are atomically claimed to prevent duplicate alerts.

## Secrets

Never commit `.env.local`, database URLs, Resend keys, Turnstile secrets, admin hash, cron secret, booking webhook secret or monitoring URL. Use a distinct random secret for each HMAC/session purpose.

## Reporting

Report vulnerabilities privately to `info@dcz.sk`. Do not include live credentials or personal data in the report.
