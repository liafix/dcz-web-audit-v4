# DCZ WebAudit
## Finálny plán dokončenia produkčnej verzie

**Projekt:** `DCZ_WebAudit_Next_Optimized_Release_Candidate_v2`  
**Cieľ:** dokončiť stabilný, pravdivý a bezpečný lead-generation funnel na `dczweb.com`  
**Výsledok:** nový final ZIP pripravený na GitHub, Vercel Preview, staging a následný kontrolovaný soft launch  
**Aktuálny verdikt:** kvalitný release candidate, ale ešte nie finálna produkčná verzia  
**Odporúčaný produktový názov:** **Predbežná automatická diagnostika titulnej stránky**  
**Zakázané tvrdenie pred rozšírením enginu:** „kompletný automatický audit celého webu“

---

# 1. Výkonný súhrn

Aktuálna aplikácia už nie je mock. Reálne:

- prijíma URL,
- vykonáva bezpečnostnú kontrolu cieľa,
- načítava verejnú titulnú stránku,
- analyzuje HTML,
- kontroluje technické súbory,
- voliteľne používa PageSpeed,
- vytvára deterministické findings,
- počíta skóre, coverage a confidence,
- ukladá audit do databázy,
- zobrazuje čiastočný report,
- získava lead cez e-mailový unlock,
- umožňuje manuálnu kontrolu,
- obsahuje jednoduchý admin.

Pred verejným launchom však treba dokončiť:

1. reprodukovateľný green build,
2. opravu retry/recovery flow,
3. oddelenie kritickej logiky od telemetrie,
4. bezpečné a scanner-resistant overenie e-mailu,
5. globálny timeout budget,
6. scoring v3 založený na aplikovateľných pravidlách,
7. rozšírenie reálne využitých auditných signálov,
8. retention cron a monitoring,
9. integračné a E2E testy,
10. kalibráciu na reálnych weboch,
11. finálne staging QA,
12. vytvorenie čistého release ZIPu.

---

# 2. Definition of Final Product

Finálna MVP verzia DCZ WebAudit musí pravdivo komunikovať, že ide o:

> Automatickú predbežnú diagnostiku verejne dostupných signálov titulnej stránky.

Systém musí byť schopný:

1. bezpečne prijať URL,
2. vytvoriť samostatný audit pre každého používateľa,
3. spracovať audit bez nekonečného loadingu,
4. zobraziť reálne evidence,
5. rozlíšiť pozorované, nenájdené, odvodené a neznáme signály,
6. vypočítať skóre iba z reálne meraných pravidiel,
7. zobraziť coverage a confidence,
8. poslať používateľovi magic link,
9. overiť používateľa až po vedomej interakcii,
10. uložiť samostatný lead bez prepisovania,
11. poslať DCZ kompletnú notifikáciu,
12. umožniť manuálnu kontrolu,
13. evidovať funnel metriky,
14. umožniť administrátorovi spracovať lead,
15. byť nasaditeľný cez GitHub na Vercel Preview,
16. mať green CI a reprodukovateľný release.

---

# 3. Záväzné priority

## P0 — blokátory pred soft launchom

- green `npm ci`, lint, typecheck, test a build,
- `package-lock.json`,
- oprava progress retry a stale recovery,
- telemetria nesmie pokaziť audit,
- jednotný timeout pre headers aj body stream,
- scanner-resistant e-mail verification,
- scoring v3,
- reálne využitie meta robots a PageSpeed kategórií,
- retention cron,
- error monitoring,
- integračné testy hlavného funnelu,
- Vercel Preview QA.

## P1 — pred verejným marketingovým launchom

- kalibrácia na 25–30 reálnych weboch,
- admin lead workflow,
- UTM a referrer atribúcia,
- bezpečnostný test corpus,
- Resend produkčná doména,
- SPF, DKIM, DMARC,
- Turnstile produkčné keys,
- mobile/cross-browser QA,
- privacy právna kontrola,
- backup/restore dokumentácia.

## P2 — po soft launchi

- multi-page crawl,
- rendered DOM cez browser worker,
- screenshot audit,
- pokročilá accessibility kontrola,
- competitor/SEO rozšírenia,
- PDF export,
- AI narrative iba nad overenými evidence,
- CRM integrácia.

---

# 4. Fáza 0 — Reprodukovateľný release build

## Cieľ

Každý checkout musí vytvoriť rovnaký build.

## Úlohy

1. Použiť:
   - Node.js 22 LTS,
   - npm 10.9.4.

2. Do `package.json` pridať:

```json
{
  "engines": {
    "node": ">=22 <23"
  },
  "packageManager": "npm@10.9.4"
}
```

3. Vymazať:

```text
node_modules
.next
package-lock.json
```

4. Spustiť:

```bash
npm install --no-audit --no-fund
```

5. Commitnúť nový `package-lock.json`.

6. CI musí používať výhradne:

```bash
npm ci --no-audit --no-fund
```

7. Spustiť:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

8. Vytvoriť `TEST_REPORT.md` s presným výsledkom.

## Akceptačné kritériá

- `package-lock.json` existuje,
- `npm ci` PASS,
- lint PASS,
- TypeScript PASS,
- unit tests PASS,
- production build PASS,
- GitHub Actions green,
- žiadne secrets v repozitári.

---

# 5. Fáza 1 — Oprava retry a recovery flow

## Problém

Retry sa môže spustiť, ale klient už nemusí pokračovať v pollingu. Používateľ môže zostať na starej failed obrazovke.

## Dotknuté súbory

```text
src/components/audit/progress-client.tsx
src/app/api/audit/[token]/status/route.ts
src/app/api/audit/[token]/process/route.ts
src/lib/db/queries.ts
src/app/audit/[token]/failed/page.tsx
```

## Implementácia

### 5.1 Status endpoint

Musí vracať:

```ts
{
  status,
  stage,
  ready,
  failed,
  retryable,
  stale,
  attemptCount,
  maxAttempts,
  lastHeartbeatAt,
  retryAfterMs,
  resultUrl,
  failureUrl
}
```

### 5.2 Progress klient

- polling každých 1,5 sekundy,
- po `stale=true` vykonať idempotentný retrigger,
- po retry vždy naplánovať ďalší poll,
- zabrániť paralelným retry requestom,
- zaviesť client-side cooldown,
- po `maxAttempts` zobraziť failed CTA.

### 5.3 Failed stránka

Pridať:

- „Skúsiť audit znova“,
- „Požiadať o manuálnu kontrolu“,
- error ID,
- bezpečné vysvetlenie,
- link na kontakt.

### 5.4 DB recovery fields

Audit musí obsahovať:

```text
attemptCount
lastHeartbeatAt
processingLeaseUntil
lastErrorCode
lastErrorId
```

Každá etapa auditu aktualizuje heartbeat.

## Akceptačné kritériá

- žiadny audit nezostane nekonečne v progress stave,
- retry po zlyhaní pokračuje v pollingu,
- po max pokusoch sa zobrazí bezpečný fallback,
- proces je idempotentný.

---

# 6. Fáza 2 — Telemetria nesmie zlyhať hlavný funnel

## Problém

Zlyhanie `recordFunnelEvent()` môže spätne označiť úspešný audit ako failed.

## Dotknuté súbory

```text
src/lib/analytics/funnel.ts
src/lib/audit/pipeline.ts
src/app/api/audit/start/route.ts
src/app/api/audit/[token]/unlock/route.ts
src/app/api/audit/[token]/manual-review/route.ts
src/app/access/[token]/route.ts
```

## Implementácia

Vytvoriť wrapper:

```ts
export async function recordFunnelEventSafe(...): Promise<void> {
  try {
    await recordFunnelEvent(...);
  } catch (error) {
    logNonCriticalError(error);
  }
}
```

Pravidlo:

> Analytics, email tracking a non-critical events nikdy nesmú zmeniť úspešný business stav na failed.

Hlavná operácia musí byť dokončená pred best-effort telemetriou.

## Akceptačné kritériá

- zlyhanie funnel event insertu neovplyvní audit,
- zlyhanie analytics neovplyvní unlock,
- zlyhanie tracking eventu neovplyvní magic link,
- všetky non-critical chyby sa logujú s correlation ID.

---

# 7. Fáza 3 — Scanner-resistant e-mail verification

## Problém

GET magic link môže automaticky otvoriť e-mailový scanner a omylom označiť e-mail ako overený.

## Nový flow

```text
unlock formulár
→ pending lead
→ e-mail magic link
→ GET /access/[token]
→ potvrdenie „Otvoriť výsledok“
→ POST /access/[token]/confirm
→ emailVerifiedAt
→ access cookie
→ full report
```

## Dotknuté súbory

```text
src/app/access/[token]/page.tsx
src/app/access/[token]/confirm/route.ts
src/lib/auth/report-access.ts
src/app/api/audit/[token]/unlock/route.ts
src/components/forms/unlock-form.tsx
src/app/audit/[token]/check-email/page.tsx
```

## Implementácia

### GET

- token iba overiť,
- nič nemeniť v DB,
- nenastaviť cookie,
- zobraziť potvrdenie.

### POST confirm

- overiť CSRF/origin,
- skontrolovať token,
- označiť `emailVerifiedAt`,
- nastaviť access cookie,
- označiť token ako použitý,
- zapísať event,
- redirect na full report.

### UX

Check-email stránka:

- potvrdenie odoslania,
- 72-hodinová platnosť,
- resend po cooldown,
- možnosť opraviť e-mail,
- kontakt pri probléme.

## Akceptačné kritériá

- samotný GET neoverí e-mail,
- full report nie je dostupný bez POST potvrdenia,
- scanner nevytvorí verified lead,
- token expiry funguje,
- replay semantics sú jasne definované.

---

# 8. Fáza 4 — Globálny timeout budget

## Problém

Timeout platí iba na získanie response headers. Pomalý body stream môže držať funkciu až do Vercel timeoutu.

## Dotknuté súbory

```text
src/lib/security/safe-fetch.ts
src/lib/security/read-limited-body.ts
src/lib/audit/pipeline.ts
src/lib/audit/pagespeed.ts
src/lib/audit/technical-files.ts
```

## Implementácia

### 8.1 Jeden AbortController

Jeden controller musí pokrývať:

- DNS,
- connect,
- headers,
- body stream,
- redirect chain.

### 8.2 Časové budgety

Odporúčaný MVP budget:

```text
homepage fetch: 12 s
robots: 4 s
sitemap: 4 s
PageSpeed: 10 s
DB + scoring + report: 8 s
rezerva: 12 s
celkom: max 50 s
```

### 8.3 Fail-soft providers

- PageSpeed timeout nesmie zablokovať report,
- robots/sitemap timeout nesmie zablokovať report,
- sekundárne zdroje musia skončiť ako `UNKNOWN`.

### 8.4 Celkový deadline

`processAudit()` dostane deadline:

```ts
const deadline = Date.now() + 50_000;
```

Každá fáza kontroluje zostávajúci čas.

## Akceptačné kritériá

- slow body stream sa preruší,
- audit skončí pred platformovým timeoutom,
- PageSpeed nedostupnosť neblokuje report,
- timeout výsledok je bezpečne zobrazený.

---

# 9. Fáza 5 — Scoring v3

## Cieľ

Nahradiť heuristic scoring model transparentným rule-based modelom.

## Nový rule contract

```ts
type AuditRuleResult = {
  id: string;
  category: AuditCategory;
  weight: number;
  applicable: boolean;
  measured: boolean;
  result: "pass" | "fail" | "unknown";
  status: "OBSERVED" | "NOT_DETECTED" | "INFERRED" | "UNKNOWN" | "NOT_APPLICABLE";
  severity?: "low" | "medium" | "high" | "critical";
  evidence?: Evidence[];
  impact?: string;
  recommendation?: string;
};
```

## Výpočet coverage

```text
súčet váh measured=true
/
súčet váh applicable=true
```

## Výpočet score

```text
súčet váh pravidiel result=pass
/
súčet váh pravidiel result=pass alebo fail
```

`unknown` sa nezapočítava do score, ale znižuje coverage/confidence.

## Confidence

Musí vychádzať z:

- coverage,
- fetch quality,
- HTML completeness,
- provider availability,
- rule certainty,
- počet analyzovaných zdrojov.

## UI pravidlá

- coverage pod 40 % → nezobrazovať numerické category score,
- coverage 40–60 % → „orientačné skóre“,
- coverage nad 60 % → zobraziť skóre,
- žiadna kategória nesmie mať 100 bez dostatočného coverage.

## Akceptačné kritériá

- JS-only stránka nedostane automaticky 100,
- `UNKNOWN` sa neprezentuje ako pass,
- každé skóre má coverage,
- výpočet je reprodukovateľný.

---

# 10. Fáza 6 — Rozšírenie auditných pravidiel

## Povinné pravidlá v MVP

### Technika

- HTTPS,
- redirect HTTP → HTTPS,
- response status,
- response time,
- HTML size,
- viewport,
- canonical,
- language,
- compression indicator,
- basic security headers.

### SEO

- title exists,
- title length,
- meta description exists,
- meta description length,
- H1 count,
- heading hierarchy,
- canonical validity,
- meta robots/noindex,
- robots.txt,
- sitemap,
- PageSpeed SEO.

### Accessibility

- image alt coverage,
- form label coverage,
- viewport,
- PageSpeed accessibility,
- empty buttons/links,
- lang attribute.

### Trust

- contact path,
- phone/email presence,
- privacy link,
- company identity,
- about page,
- structured data,
- footer identity.

### Conversion

- primary CTA presence,
- CTA clarity,
- form presence,
- booking/order/quote path,
- visible contact method,
- CTA repetition,
- friction indicators.

### Revenue readiness

- booking signal,
- quote/request signal,
- purchase/order signal,
- contact-only fallback,
- unclear next step.

## Status mapping

- priamo namerané → `OBSERVED`,
- nenájdené v analyzovanom HTML → `NOT_DETECTED`,
- obchodná interpretácia → `INFERRED`,
- nedostupné dáta → `UNKNOWN`,
- nerelevantné pravidlo → `NOT_APPLICABLE`.

## Akceptačné kritériá

- meta robots `noindex` je kritický SEO finding,
- PageSpeed accessibility sa reálne používa,
- PageSpeed best practices sa používa,
- PageSpeed SEO sa používa,
- recommendation je naviazané na evidence.

---

# 11. Fáza 7 — Kalibračný dataset

## Cieľ

Overiť false positives a false negatives pred marketingovým launchom.

## Dataset

Minimálne 30 webov:

```text
5 lokálnych služieb
5 reštaurácií / rezervácií
5 fitness / wellness
5 e-commerce
5 realitných / developerských
5 moderných React / Next / SPA
```

## Pre každý web uložiť

```text
URL
vertikála
automatický finding
manuálne potvrdené?
false positive?
false negative?
správna severity?
správna recommendation?
coverage
confidence
overall score
```

## Výstup

```text
docs/CALIBRATION_REPORT.md
tests/fixtures/calibration/
```

## Akceptačné kritériá

- kritické pravidlá majú manuálne overené výsledky,
- najčastejšie false positives sú opravené,
- scoring thresholdy sú zdokumentované,
- confidence je kalibrované.

---

# 12. Fáza 8 — Retention, cron a privacy konzistencia

## Problém

Privacy uvádza retenciu, ale purge nemusí automaticky bežať a lead retention nie je kompletne implementovaný.

## Dotknuté súbory

```text
src/lib/db/queries.ts
src/app/api/cron/purge/route.ts
vercel.json
src/app/privacy/page.tsx
drizzle/*
```

## Implementácia

### Audit retention

- evidence/report: 45 dní,
- po 45 dňoch anonymizovať alebo zmazať,
- access tokeny zmazať po expiracii.

### Lead retention

- 24 mesiacov alebo podľa právneho základu,
- marketing consent uchovať samostatne,
- podpora export/delete requestu.

### Funnel events

- 180 dní,
- PII redaction.

### Cron

Do `vercel.json` pridať denný cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/purge",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Endpoint musí vyžadovať `CRON_SECRET`.

## Akceptačné kritériá

- purge je automaticky spúšťaný,
- audit purge nezmaže lead,
- lead purge zodpovedá privacy textu,
- cron bez secretu je odmietnutý.

---

# 13. Fáza 9 — Monitoring a alerting

## Minimum

- Sentry alebo ekvivalent,
- structured server logs,
- correlation ID,
- audit ID v logoch,
- Resend failure logging,
- health endpoint,
- uptime monitor,
- alert pri zvýšenej failure rate.

## Dotknuté súbory

```text
src/instrumentation.ts
src/lib/logging/*
src/app/api/health/route.ts
src/lib/email/*
src/lib/audit/pipeline.ts
README.md
VERCEL_DEPLOYMENT.md
```

## Povinné metriky

- audits started,
- audits completed,
- audit failure rate,
- average processing time,
- PageSpeed timeout rate,
- unlock conversion,
- verified e-mail rate,
- manual review rate,
- Resend failure count,
- DB error count.

## Akceptačné kritériá

- produkčná chyba má correlation ID,
- error sa objaví v monitoringu,
- health endpoint overí DB,
- alerting je otestované.

---

# 14. Fáza 10 — Admin lead workflow

## Cieľ

DCZ musí vedieť lead spracovať bez externého CRM.

## Lead stages

```text
New
Verified
Contacted
Qualified
Proposal
Won
Lost
NeedsReview
```

## Polia

```text
owner
status
note
nextActionAt
lastContactedAt
utmSource
utmMedium
utmCampaign
referrerHost
```

## Admin funkcie

- zmena statusu,
- interná poznámka,
- next action,
- audit deep link,
- mailto/tel quick action,
- filtrovanie,
- export CSV neskôr.

## Bezpečnosť

- admin action audit log,
- rate limiting loginu,
- secure cookies,
- noindex/no-store,
- žiadne secrets v klientovi.

## Akceptačné kritériá

- DCZ vie spracovať celý lead lifecycle,
- zmeny sú auditované,
- notifikačný e-mail obsahuje primaryGoal a top findings.

---

# 15. Fáza 11 — UI/UX finalizácia

## Homepage

### H1

> Zistite, čo na vašom webe brzdí dopyty.

### Subtitle

> Za pár minút preveríme verejne dostupné signály titulnej stránky — techniku, SEO, dôveru a cestu ku kontaktu. Dostanete prioritné zistenia, dôkazy a odporúčania bez zásahov do webu.

### Povinné sekcie

1. Hero + URL input.
2. Čo získate.
3. Ukážka výsledku.
4. Ako audit funguje.
5. Čo audit robí / nerobí.
6. Overiteľné DCZ referencie.
7. Trust bar.
8. FAQ.
9. Final CTA.
10. Footer s identitou AesDC s. r. o.

## Unlock

Label:

> E-mail, na ktorý pošleme celý výsledok *

Helper:

> Firemný e-mail odporúčame, ale nie je podmienkou.

Pridať:

- privacy link,
- check-email state,
- resend,
- change email.

## Report

Zobraziť:

- score,
- coverage,
- confidence,
- analyzovaný rozsah,
- status badge,
- source URL,
- evidence,
- recommendation,
- contextual CTA.

Premenovať:

```text
Skóre webu
```

na:

```text
Skóre analyzovaných signálov
```

## Failed flow

- retry,
- manual review,
- error ID,
- contact.

## Mobile a accessibility

Testovať:

```text
375×812
390×844
768×1024
1024×768
1440×900
```

Povinné:

- viditeľný focus,
- keyboard flow,
- min. 44 px touch targets,
- reduced motion,
- bez horizontal overflow,
- správny contrast.

---

# 16. Fáza 12 — Testovacia matica

## Unit testy

- URL normalizer,
- blocked IPv4/IPv6,
- credentials,
- ports,
- mixed DNS,
- redirect to private IP,
- timeout,
- slow body,
- oversized body,
- content type,
- scoring,
- coverage,
- status mapping,
- token hash,
- token expiry,
- admin session.

## Integration testy

- start creates audit,
- two users same URL create separate leads,
- process succeeds,
- process fails safely,
- stale retry,
- analytics failure does not fail audit,
- unlock creates pending lead,
- GET link does not verify,
- POST confirm verifies,
- full report access,
- expired token,
- manual review notification,
- purge preserves lead.

## E2E testy

- desktop full funnel,
- mobile full funnel,
- keyboard-only,
- failed flow,
- resend flow,
- admin login,
- admin rate limit,
- result noindex,
- preview noindex,
- privacy links.

## Security corpus

- localhost,
- RFC1918,
- IPv6 private,
- metadata addresses,
- IPv4-mapped IPv6,
- mixed DNS,
- DNS rebinding simulation,
- redirect to private,
- compression bomb,
- slow body,
- oversized response,
- invalid content type,
- redirect loop.

---

# 17. Fáza 13 — Vercel Preview a staging

## Environment variables

```text
DATABASE_URL
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
MAIL_FROM
DCZ_NOTIFICATION_EMAIL
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
TURNSTILE_ENABLED
TURNSTILE_SECRET_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
GOOGLE_PAGESPEED_API_KEY
CRON_SECRET
SENTRY_DSN
```

## Poradie

1. GitHub release branch.
2. Vercel Preview.
3. Neon staging DB.
4. Migrations.
5. Resend test domain.
6. Turnstile test keys.
7. Preview noindex.
8. Full funnel QA.
9. `staging.dczweb.com`.
10. Real email QA.
11. Security corpus.
12. Mobile QA.
13. Release tag.
14. Production deploy.

## Akceptačné kritériá

- preview je noindex,
- celý funnel prejde,
- DB migrations PASS,
- e-mail link funguje,
- admin funguje,
- monitoring prijíma test error,
- cron funguje,
- rollback je zdokumentovaný.

---

# 18. Fáza 14 — Final ZIP

## ZIP musí obsahovať

```text
src/
public/
drizzle/
scripts/
tests/
.github/workflows/ci.yml
package.json
package-lock.json
next.config.ts
vercel.json
tsconfig.json
eslint.config.mjs
vitest.config.ts
.env.example
.gitignore
README.md
VERCEL_DEPLOYMENT.md
DEPLOYMENT_CHECKLIST.md
SECURITY.md
TEST_REPORT.md
CALIBRATION_REPORT.md
CHANGELOG.md
FILE_MANIFEST.txt
```

## ZIP nesmie obsahovať

```text
.env.local
.env.production
node_modules
.next
.vercel
.git
logs
coverage
secrets
produkčné DB credentials
API keys
pôvodný Laravel projekt
```

## Pred zabalením

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
git diff --check
```

## Výstupy

```text
DCZ_WebAudit_Next_Final_Production_v1.zip
DCZ_WebAudit_Next_Final_Production_v1.zip.sha256
DCZ_WebAudit_Next_Final_Production_v1_MANIFEST.txt
DCZ_WebAudit_Next_Final_Test_Report.md
```

---

# 19. Finálna Definition of Done

## Build

- [ ] `package-lock.json` existuje.
- [ ] `npm ci` PASS.
- [ ] ESLint PASS.
- [ ] TypeScript PASS.
- [ ] Unit testy PASS.
- [ ] Integration testy PASS.
- [ ] E2E testy PASS.
- [ ] `next build` PASS.
- [ ] GitHub Actions green.
- [ ] Žiadne secrets.

## Audit engine

- [ ] SSRF corpus PASS.
- [ ] Full body timeout PASS.
- [ ] Findings statusy sú správne.
- [ ] Scoring v3 používa applicable/measured rules.
- [ ] Coverage je reálne vypočítané.
- [ ] Meta robots sa používa.
- [ ] PageSpeed SEO/accessibility/best-practices sa používajú.
- [ ] PageSpeed výpadok neblokuje report.
- [ ] Retry/recovery funguje.
- [ ] Telemetria nemôže zlyhať audit.

## Funnel

- [ ] URL → progress → partial report PASS.
- [ ] Unlock vytvorí pending lead.
- [ ] GET magic link nič neoverí.
- [ ] POST confirm overí e-mail.
- [ ] Full report je chránený.
- [ ] Dva leady rovnakej domény sa neprepíšu.
- [ ] Manual review odošle celý kontext.
- [ ] UTM/referrer sa uloží.
- [ ] Admin workflow funguje.

## Security

- [ ] Turnstile fail-closed.
- [ ] Rate limiting aktívny.
- [ ] Admin brute-force ochrana.
- [ ] Raw errors nie sú verejné.
- [ ] CSP/HSTS/no-store.
- [ ] Cron chránený secretom.
- [ ] Tokeny sa neukladajú v plaintext.
- [ ] Security logs redigujú PII.

## Operations

- [ ] Health monitor.
- [ ] Error monitoring.
- [ ] Email failure monitoring.
- [ ] Retention cron.
- [ ] Backup/restore dokumentácia.
- [ ] Rollback test.
- [ ] Staging QA.
- [ ] Doména a TLS.
- [ ] 48-hodinový hypercare plán.

---

# 20. Odporúčané poradie realizácie

1. Fáza 0 — green build a lockfile.
2. Fáza 1 — retry/recovery.
3. Fáza 2 — safe telemetry.
4. Fáza 3 — verified e-mail flow.
5. Fáza 4 — timeout budget.
6. Fáza 5 — scoring v3.
7. Fáza 6 — audit rules.
8. Fáza 8 — retention/cron.
9. Fáza 9 — monitoring.
10. Fáza 10 — admin workflow.
11. Fáza 11 — UI/UX finalizácia.
12. Fáza 12 — test matrix.
13. Fáza 7 — kalibrácia.
14. Fáza 13 — preview/staging.
15. Fáza 14 — final ZIP.

---

# 21. Finálny verdikt

Po aplikovaní tohto plánu bude DCZ WebAudit vhodný ako:

> Predbežná automatická diagnostika titulnej stránky, ktorá používa reálne verejne dostupné evidence, vysvetliteľné skóre a overený lead funnel.

Na označenie „kompletný audit celého webu“ bude stále potrebné doplniť:

- multi-page crawling,
- browser rendering,
- vizuálny audit,
- accessibility browser testing,
- formulárové E2E kontroly,
- hlbší SEO audit,
- analytiku a konverzné eventy,
- rozšírenú kalibráciu.

Pre prvý verejný soft launch však tento plán definuje dostatočne bezpečný, pravdivý a obchodne použiteľný finálny MVP rozsah.
