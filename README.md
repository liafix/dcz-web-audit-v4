# DCZ WebAudit — High-End Revenue Diagnostic v4

Next.js lead-generation a decision-enablement funnel pre predbežnú diagnostiku verejných signálov titulnej stránky. Projekt je pripravený pre GitHub deployment na Hostinger Node.js Web App alebo Vercel a používa PostgreSQL/Neon, Resend, Cloudflare Turnstile a voliteľný PageSpeed API.

## Cieľový funnel

1. URL formulár
2. reálny audit
3. Executive Preview
4. Money Leak Map
5. e-mailový unlock
6. vedomé overenie e-mailu
7. celý report
8. ROI scenáre
9. tri kvalifikačné otázky
10. kontextová DCZ ponuka
11. relevantná case study
12. rezervácia diagnostického hovoru
13. Opportunity Brief
14. Fit/Intent scoring a admin routing
15. personalizovaný follow-up

## Čo projekt reálne robí

- bezpečne načíta verejnú titulnú stránku a technické súbory,
- analyzuje technické, SEO, accessibility, trust, conversion a revenue signály,
- používa evidence-backed findings, coverage a confidence,
- vytvorí orientačný obchodný profil, Executive Summary a Money Leak Map,
- modeluje konzervatívny, realistický a rastový ROI scenár iba zo zadaných údajov,
- odporučí jeden z tierov Conversion Foundation, Growth Funnel alebo Revenue Platform,
- zobrazuje iba relevantnú case study a jasne rozlišuje dodaný projekt, demo a koncept,
- umožní scanner-resistant e-mail verification, Opportunity Brief a booking,
- počíta Company Fit a Buying Intent, vytvára Priority A/B/C/Nurture routing,
- spracúva servisné a marketingové follow-upy so stop podmienkami,
- poskytuje DCZ admin dashboard, lead workflow a manuálne označenie rezervácie.

## Produktový limit

Ide o **predbežnú automatickú diagnostiku titulnej stránky**, nie kompletný crawl alebo finančný audit. JavaScript-only obsah nemusí byť viditeľný. Money Leak Map opisuje možný mechanizmus bariéry a ROI je modelový scenár, nie garancia ani presný výpočet ušlých tržieb.

## Lokálne spustenie

Požiadavky: Node.js 22, npm 10.9.4, PostgreSQL/Neon.

```powershell
Copy-Item .env.example .env.local
npm ci --include=dev --no-audit --no-fund
npm run db:migrate
npm run admin:hash -- "VELMI-SILNE-HESLO-16-PLUS"
npm run dev
```

Vyplňte `.env.local`. Minimálne potrebujete `DATABASE_URL`, tri nezávislé secrets, admin účet, Resend a pre verejnú produkciu Turnstile. Booking potrebuje `DIAGNOSTIC_BOOKING_URL`.

## Povinný release gate

```powershell
.\FINALIZE_RELEASE.ps1
```

Skript vyžaduje existujúci a overený `package-lock.json`, vykoná čisté `npm ci`, workspace verification, production dependency audit, lint, TypeScript, Vitest a Next production build. Potom vytvorí čistý staging, spustí strict release verification a až po všetkých zelených gateoch vytvorí ZIP, manifest a SHA-256.

## Hostinger Node.js Web App

Primárny deployment návod: [HOSTINGER_DEPLOYMENT.md](HOSTINGER_DEPLOYMENT.md)

- Node.js 22
- install: `npm ci --include=dev --no-audit --no-fund`
- build: `npm run build`
- start: `npm run start`
- externá PostgreSQL databáza Neon
- Hostinger cron pre purge a follow-ups

## Dokumentácia

- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- [HOSTINGER_DEPLOYMENT.md](HOSTINGER_DEPLOYMENT.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [TEST_REPORT.md](TEST_REPORT.md)
- [CALIBRATION_REPORT.md](CALIBRATION_REPORT.md)
- [docs/HIGH_END_REVENUE_FUNNEL_PLAN.md](docs/HIGH_END_REVENUE_FUNNEL_PLAN.md)
