# Vercel deployment — secondary option

> **Komerčná prevádzka:** DCZ WebAudit je lead-generation funnel. Pred ostrým launchom použite Vercel plán alebo inú platformu, ktorá povoľuje komerčné použitie podľa aktuálnych podmienok. Preview/test prostredie nesmie byť zamieňané s produkčným oprávnením.

## 1. Pred deployom

1. Použite Node.js 22 až 24.
2. Na Windows spustite `.\PREPARE_RELEASE.ps1` (na Linux/macOS `./PREPARE_RELEASE.sh`).
3. Commitnite vygenerovaný `package-lock.json` a pushnite iba green release commit.
4. Vytvorte Neon PostgreSQL databázu v preferovanom európskom regióne.
5. Overte doménu v Resende a nastavte SPF, DKIM a DMARC.
6. Vytvorte Cloudflare Turnstile widget pre produkčnú doménu.

## 2. Environment variables

### Všetky prostredia

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PREVENT_INDEXING`
- `REQUEST_FINGERPRINT_SECRET`
- `ACCESS_COOKIE_SECRET`
- `ADMIN_SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

### Produkcia

- `RESEND_API_KEY`
- `MAIL_FROM`
- `DCZ_NOTIFICATION_EMAIL`
- `TURNSTILE_ENABLED=true`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `CRON_SECRET`
- `MONITORING_WEBHOOK_URL`
- `DIAGNOSTIC_BOOKING_URL`
- `BOOKING_WEBHOOK_SECRET`
- voliteľne `GOOGLE_PAGESPEED_API_KEY`

Preview má používať `NEXT_PUBLIC_PREVENT_INDEXING=true`. Ostrá overená doména používa `false`.

## 3. Databáza

```bash
npm run db:migrate
```

Skript aplikuje všetky očíslované SQL migrácie v adresári `drizzle/`.

## 4. Vercel projekt

- Framework preset: Next.js
- Node runtime: 22
- Región: `fra1`
- Build command: `npm run build`
- Install command: `npm ci`

Najprv deploynite Preview. Nepripájajte apex `dczweb.com`, kým neprejde celý funnel a `/api/health` nevráti stav `ok`.

## 5. Cron

Vercel konfigurácia obsahuje retention aj follow-up cron. Vercel Cron alebo náhradný scheduler volá:

```text
GET /api/cron/purge
Authorization: Bearer <CRON_SECRET>
```

Retention cron vymaže expirované access tokeny, staré audity a staré eventy. Lead pred vymazaním auditu odpojí a zachová snapshot domény/URL. Follow-up cron volá `GET /api/cron/follow-ups` s rovnakým Bearer secretom.

## 6. Povinný preview smoke test

1. URL → progress → ready.
2. Invalid/private URL je odmietnutá.
3. Partial report obsahuje statusy a coverage.
4. Unlock neotvorí full report priamo.
5. Resend doručí magic link.
6. Magic link zobrazí potvrdenie a až POST overí e-mail.
7. Full report obsahuje Money Leak Map, ROI, kvalifikáciu a kontextovú ponuku.
8. Case study má správny proof type, booking a Opportunity Brief fungujú.
9. Fit/Intent scoring a Priority A routing fungujú.
10. Follow-up cron rešpektuje booking, sales stage a marketing consent.
11. Dva kontakty pre rovnakú doménu sa neprepíšu.
12. Admin login je limitovaný a lead workflow sa uloží.
13. Súkromné routy sú noindex/no-store.
14. Mobile 375×812 a 390×844 bez overflow.

## 7. DNS cutover

Najprv použite `staging.dczweb.com`. Po QA pridajte `dczweb.com` a `www.dczweb.com`, nastavte jeden canonical host a redirect druhého variantu. Pôvodný redirect na dcz.sk vypnite až po potvrdení TLS, health, DB a e-mailov.

## 8. Rollback

- prepnite Vercel alias na posledný funkčný deployment alebo obnovte pôvodný DNS/redirect,
- migrácie pred ostrým nasadením zálohujte,
- secrets nikdy necommitujte,
- pri e-mailovom výpadku ponechajte leady uložené a zastavte reklamnú návštevnosť.

- `MONITORING_WEBHOOK_URL` – povinný HTTPS endpoint pre kritické structured error eventy v live produkcii.
- `CRON_SECRET` – povinný Bearer secret pre denný purge cron.
