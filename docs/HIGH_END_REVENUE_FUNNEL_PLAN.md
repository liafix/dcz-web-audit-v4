# DCZ WebAudit
## High-End Revenue Diagnostic Funnel — implementačný a optimalizačný plán

**Východiskový projekt:** `DCZ_WebAudit_Next_Final_MVP_v3_Source_Candidate`  
**Analyzovaný artefakt:** používateľom dodaný ZIP so 148 súbormi  
**Cieľ:** zmeniť súčasný kvalitný technický lead magnet na prémiový diagnostický funnel, ktorý ukáže, kde web môže brzdiť dopyty a obchodné príležitosti, kvalifikuje serióznych klientov a vedie ich k priamemu kontaktu s DCZ  
**Cieľová doména:** `dczweb.com`  
**Výsledný produktový názov:** **DCZ Revenue Diagnostic** alebo **DCZ WebAudit — Revenue Diagnostic**  
**Produkčný positioning:** predbežná automatická diagnostika titulnej stránky a jej verejne dostupných technických, SEO, dôveryhodnostných, konverzných a príjmových signálov  
**Zakázané tvrdenie:** „presne vypočítame, koľko peňazí firma stráca“ bez vstupných dát a overenia

---

# 1. Výkonný súhrn

Aktuálny projekt už obsahuje silný a funkčne premyslený základ:

- URL formulár,
- bezpečný reálny audit titulnej stránky,
- SSRF ochranu,
- progress a recovery flow,
- čiastočný report,
- e-mailový unlock,
- scanner-resistant overenie e-mailu,
- chránený celý report,
- scoring v3,
- coverage a confidence,
- prioritné findings,
- silné stránky,
- základné kontextové príležitosti,
- manuálnu kontrolu,
- lead scoring,
- admin workflow,
- UTM/referrer atribúciu,
- e-mailové notifikácie,
- retention cron,
- bezpečnostné a deployment dokumenty.

Projekt však zatiaľ funguje najmä ako:

> technická a konverzná diagnostika, ktorá získava overený kontakt.

Na získavanie serióznych high-end klientov ho treba rozšíriť na:

> riadený rozhodovací funnel, ktorý preloží auditné evidence do obchodných rizík, modelových ROI scenárov, personalizovaného riešenia, relevantného dôkazu a konkrétneho obchodného ďalšieho kroku.

Finálny požadovaný tok:

1. URL formulár  
2. Reálny audit  
3. Executive preview  
4. Money Leak Map  
5. E-mailový unlock  
6. Overenie e-mailu  
7. Celý report  
8. ROI scenáre  
9. 3 kvalifikačné otázky  
10. Kontextová DCZ ponuka  
11. Relevantná case study  
12. Rezervácia diagnostického hovoru  
13. Opportunity Brief  
14. Lead scoring a admin routing  
15. Personalizovaný follow-up  

---

# 2. Audit aktuálneho stavu

## 2.1 Súhrn pripravenosti jednotlivých krokov

| Krok | Aktuálny stav | Hodnotenie | Čo už existuje | Čo chýba |
|---|---|---:|---|---|
| 1. URL formulár | dokončený | 90 % | validácia, Turnstile, UTM, referrer, error ID | jemné high-end copy a segmentačný signál |
| 2. Reálny audit | dokončený MVP | 80 % | safe fetch, HTML, robots, sitemap, PageSpeed, evidence, rules | vertikálne pravidlá, multi-page/browser audit neskôr |
| 3. Executive preview | čiastočne | 45 % | score, coverage, confidence, top 3 findings | CEO summary, top risk, top opportunity, recommended first investment |
| 4. Money Leak Map | chýba | 10 % | jednotlivé findings a impact texty | samostatná obchodná mapa strát a bariér |
| 5. E-mailový unlock | dokončený | 90 % | email, meno, firma, telefón, cieľ, consent | optimalizácia friction a progressive profiling |
| 6. Overenie e-mailu | dokončené | 95 % | GET preview + vedomý POST confirm, hash token, expiry | eventy a UX detail pre návrat/nové zariadenie |
| 7. Celý report | dokončený MVP | 80 % | full findings, strengths, opportunities, evidence, limits | executive order, money map, ROI, segment-specific CTA |
| 8. ROI scenáre | chýbajú | 0 % | žiadny ekonomický model | konzervatívny/realistický/rastový scenár |
| 9. 3 kvalifikačné otázky | chýbajú ako samostatný krok | 20 % | primaryGoal, company, phone | buying role, timeline, business economics |
| 10. Kontextová DCZ ponuka | čiastočne | 30 % | základné `opportunities` a CTA | solution mapping, scope tier, personalized rationale |
| 11. Relevantná case study | chýba | 0 % | žiadny registry ani mapping | verifikované case studies a transparentné označenie demo/konceptu |
| 12. Rezervácia hovoru | chýba | 0 % | manuálna kontrola a externý kontakt | booking route, context token, event tracking |
| 13. Opportunity Brief | chýba | 0 % | report dáta sú použiteľné | samostatný executive brief a shareable link |
| 14. Lead scoring/admin routing | čiastočne | 45 % | jednoduché skóre 42/70 + bonusy, stages, owner, note, next action | oddelený Fit Score, Intent Score, priority routing, reasons |
| 15. Personalizovaný follow-up | chýba | 10 % | transakčný výsledok + DCZ notifikácia | condition-based follow-up sequence a cron jobs |

## 2.2 Čo sa musí zachovať bez regresie

Pri rozšírení funnelu sa nesmie poškodiť:

- URL normalizácia a SSRF ochrana,
- private/reserved IP blokovanie,
- redirect revalidation,
- response size a timeout ochrana,
- fail-soft PageSpeed,
- audit heartbeat, lease a retry,
- bezpečné verejné error messages,
- Turnstile fail-closed režim,
- rate limiting,
- samostatný audit pre návštevníka,
- hashované access tokeny,
- scanner-resistant e-mail potvrdenie,
- per-audit access cookie,
- scoring v3 a coverage,
- statusy `OBSERVED`, `NOT_DETECTED`, `INFERRED`, `UNKNOWN`, `NOT_APPLICABLE`,
- audit/lead retention oddelenie,
- UTM/referrer atribúcia,
- noindex výsledkov a adminu,
- admin autentifikácia,
- correlation IDs a bezpečné logovanie.

## 2.3 Aktuálne technické obmedzenie release

Analyzovaný ZIP stále neobsahuje `package-lock.json`. Pred začatím produkčného deployu musí finálna verzia prejsť:

```bash
npm ci
npm run verify:source
npm run lint
npm run typecheck
npm run test
npm run build
```

Tento high-end plán sa aplikuje na zdrojový kandidát, ale finálny produkčný ZIP sa smie vytvoriť až po green release gate.

---

# 3. Strategický positioning

## 3.1 Čo funnel nesmie byť

- generický bezplatný SEO checker,
- nástroj, ktorý každému ukáže rovnaký report,
- falošný kalkulátor ušlých tržieb,
- lacná vstupná brána na „web za pár stoviek“,
- agresívny lead gate bez hodnoty,
- AI text bez uloženého evidence.

## 3.2 Čo má byť

> Prémiová automatická revenue diagnostika, ktorá vedeniu firmy ukáže, ktoré verejne viditeľné signály môžu brzdiť dopyty, dôveru, rezervácie alebo predaj, a pripraví podklady na rozhodnutie o oprave.

## 3.3 Ideálny používateľ

- CEO, founder alebo konateľ,
- marketingový alebo obchodný riaditeľ,
- firma s hodnotnejším zákazníkom,
- B2B SaaS,
- developer,
- klinika,
- hotel/rezort,
- fitness alebo wellness sieť,
- profesionálna služba,
- e-commerce s dostatočnou maržou,
- firma s existujúcou návštevnosťou, ale slabým funnelom.

## 3.4 Hlavná konverzia

Primárna konverzia nemá byť iba „získali sme e-mail“.

Primárny obchodný úspech:

```text
verified lead
→ dokončený ROI model
→ kvalifikácia
→ rezervovaný diagnostický hovor
```

Sekundárny úspech:

```text
verified lead
→ opportunity brief
→ personalizovaný follow-up
→ neskorší call
```

---

# 4. Cieľová architektúra funnelu

```text
Homepage
  ↓
URL submit
  ↓
Reálny audit
  ↓
Executive preview + Money Leak teaser
  ↓
E-mail unlock
  ↓
Magic link + vedomé potvrdenie
  ↓
Celý report + Money Leak Map
  ↓
ROI scenárový model
  ↓
3 kvalifikačné otázky
  ↓
Personalizovaná DCZ ponuka
  ↓
Relevantná case study
  ↓
Rezervácia diagnostického hovoru
  ↓
Opportunity Brief
  ↓
Fit Score + Intent Score + Priority
  ↓
Admin routing
  ↓
Personalizovaný follow-up
```

---

# 5. Krok 1 — URL formulár

## Aktuálny stav

Existuje:

- jednoduchý URL input,
- UTM parametre,
- referrer,
- Turnstile,
- honeypot,
- bezpečné error ID,
- presmerovanie na progress.

## Optimalizácie

### 5.1 Copy

Hlavné CTA:

> Analyzovať obchodné bariéry webu

Nie:

> Spustiť audit

Pomocný text:

> Bez prihlásenia a bez zásahov do webu. Najskôr uvidíte prioritné zistenia, až potom sa rozhodnete, či si chcete odomknúť celý report.

### 5.2 Voliteľný segmentačný signál

Formulár má zostať s jedným povinným vstupom. Segmentáciu možno určiť:

1. automaticky z HTML signálov,
2. až po audite jednou otázkou,
3. manuálne v kvalifikácii.

Nedávať povinný „typ firmy“ pred URL.

### 5.3 Eventy

Pridať:

```text
landing_viewed
url_field_focused
audit_submit_attempted
audit_submit_succeeded
audit_submit_failed
```

Nevytvárať invazívny session replay bez osobitného posúdenia.

## Akceptácia

- URL zostáva jediný povinný údaj,
- mobilný submit je bez friction,
- eventy neobsahujú raw URL query ani PII,
- audit start conversion je merateľná.

---

# 6. Krok 2 — Reálny audit

## Aktuálny stav

Audit už používa reálne evidence:

- titulná stránka,
- HTTP/HTTPS,
- response time,
- HTML size,
- security headers,
- metadata,
- headings,
- CTA,
- formuláre,
- alt texty,
- trust signály,
- revenue signály,
- robots,
- sitemap,
- PageSpeed kategórie.

## Optimalizácie pre high-end funnel

### 6.1 Industry inference

Vytvoriť deterministickú klasifikáciu:

```ts
type BusinessVertical =
  | "b2b_saas"
  | "developer_real_estate"
  | "hotel_hospitality"
  | "fitness_wellness"
  | "clinic_health"
  | "professional_services"
  | "ecommerce"
  | "local_service"
  | "unknown";
```

Klasifikácia môže vychádzať z:

- title,
- H1,
- schema types,
- CTA textov,
- booking/order/demo/pricing signálov,
- kľúčových výrazov,
- doménového obsahu.

Výsledok musí mať:

```ts
{
  vertical: BusinessVertical;
  confidence: number;
  evidence: string[];
}
```

Pri nízkej confidence sa používateľ opýta až po odomknutí.

### 6.2 Business model inference

```ts
type BusinessModel =
  | "lead_generation"
  | "booking"
  | "ecommerce"
  | "demo_sales"
  | "subscription"
  | "information_only"
  | "unknown";
```

### 6.3 Vertikálne pravidlá

P0 vertikály:

- B2B SaaS,
- developer/reality,
- fitness/wellness,
- hotel/hospitality,
- professional services.

Každá vertikála má 5–10 doplnkových pravidiel.

Príklad B2B SaaS:

- demo/trial CTA,
- pricing alebo qualification path,
- use cases,
- integrations,
- security/trust,
- case studies,
- onboarding explanation.

Príklad developer:

- dostupné jednotky,
- pôdorysy,
- rezervácia,
- financovanie,
- predajný kontakt,
- virtuálna prehliadka,
- stav projektu.

## Akceptácia

- generické pravidlá zostávajú oddelené od vertikálnych,
- nízka vertical confidence sa neprezentuje ako fakt,
- report uvádza, aký obchodný model bol detegovaný,
- audit nevymýšľa funkcie, ktoré v evidence nevidel.

---

# 7. Krok 3 — Executive preview

## Aktuálny stav

Partial report zobrazuje:

- score,
- coverage,
- confidence,
- scope,
- top 3 findings,
- silné stránky,
- unlock.

Chýba však zhrnutie pre rozhodovateľa.

## Nový modul

Vytvoriť:

```text
src/components/revenue/executive-preview.tsx
src/lib/revenue/executive-summary.ts
```

## Obsah

### Executive headline

Príklad:

> Web má dobrý technický základ, ale cesta od záujmu ku kontaktu je nejasná.

### Päť výstupov

1. **Najväčšia bariéra**
2. **Najväčšia obchodná príležitosť**
3. **Najrizikovejší únik**
4. **Odporúčaná prvá investícia**
5. **Dôvera diagnostiky**

### Presné pravidlá

Summary sa generuje iba z:

- top findingov,
- category scores,
- coverage,
- vertical/business model inference,
- uložených evidence.

Nepoužiť generatívnu AI v P0.

## Dátový typ

```ts
interface ExecutiveSummary {
  headline: string;
  primaryRisk: {
    title: string;
    explanation: string;
    evidenceIds: string[];
  };
  primaryOpportunity: {
    title: string;
    explanation: string;
  };
  firstRecommendedInvestment: {
    title: string;
    reason: string;
  };
  decisionConfidence: number;
}
```

## Partial vs full

### Pred unlockom

- headline,
- primary risk,
- 1 money leak,
- teaser ďalších únikov.

### Po unlocku

- celé summary,
- všetky prioritné úniky,
- recommended first investment.

## Akceptácia

- CEO pochopí výsledok do 30 sekúnd,
- každé tvrdenie odkazuje na evidence/finding,
- pri coverage pod 40 % summary explicitne povie, že dáta sú obmedzené,
- nepoužíva presné finančné sumy bez vstupov.

---

# 8. Krok 4 — Money Leak Map

## Cieľ

Preložiť technické findingy do zrozumiteľných obchodných bariér.

## Money Leak kategórie

```ts
type MoneyLeakCategory =
  | "traffic_acquisition"
  | "message_clarity"
  | "trust"
  | "conversion"
  | "transaction"
  | "follow_up_measurement";
```

### 1. Traffic acquisition

- noindex,
- robots blokácia,
- chýbajúci title/meta,
- slabé SEO signály,
- sitemap.

### 2. Message clarity

- H1,
- nejasná hodnota,
- chýbajúci dominantný CTA,
- slabá informačná hierarchia.

### 3. Trust

- identita firmy,
- privacy,
- about,
- structured data,
- security/trust evidence.

### 4. Conversion

- kontaktná cesta,
- formulár,
- CTA repetition,
- labels,
- friction.

### 5. Transaction

- booking,
- order,
- quote,
- demo,
- pricing,
- payment path.

### 6. Follow-up and measurement

Aktuálne sa z verejného HTML dá zistiť iba obmedzene. V P0 používať:

- `UNKNOWN`, ak nemožno potvrdiť,
- kvalifikačnú otázku namiesto tvrdenia.

## Money Leak objekt

```ts
interface MoneyLeak {
  id: string;
  category: MoneyLeakCategory;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  certainty: number;
  status: FindingStatus;
  mechanism: string;
  blockedBusinessStep: string;
  evidenceIds: string[];
  recommendedFix: string;
  effortBand: "small" | "medium" | "large";
  expectedDirection: "traffic" | "trust" | "lead_rate" | "booking_rate" | "sales_efficiency";
}
```

## UI

Vytvoriť:

```text
src/components/revenue/money-leak-map.tsx
src/components/revenue/money-leak-card.tsx
src/lib/revenue/money-leaks.ts
```

Zobrazenie:

- top 3 úniky,
- cesta `návštevník → dôvera → akcia → kontakt`,
- stav bariéry,
- evidence,
- oprava,
- certainty.

## Zakázané formulácie

- „strácate 10 000 € mesačne“,
- „toto určite znižuje konverzie o 30 %“,
- „oprava garantuje nárast“.

## Povolená formulácia

> Tento signál môže brzdiť prechod návštevníka ku kontaktu. Finančný dopad sa dá modelovať až po doplnení vašich obchodných vstupov.

## Akceptácia

- Money Leak Map nie je duplicitný zoznam findings,
- každý leak obsahuje mechanizmus a blokovaný obchodný krok,
- sumy sa zobrazia až po ROI vstupe,
- pri neznámom signále sa zobrazí `Neoverené`.

---

# 9. Kroky 5 a 6 — E-mailový unlock a overenie

## Aktuálny stav

Tieto kroky sú technicky kvalitne implementované:

- pending lead,
- e-mail s tokenom,
- GET confirmation page,
- vedomý POST confirm,
- access cookie,
- verified lead,
- DCZ notification.

## Optimalizácie

### 9.1 Progressive profiling

Na unlock formulári ponechať:

- e-mail povinný,
- meno voliteľné,
- firma voliteľná.

Telefón a primaryGoal presunúť do následnej kvalifikácie alebo ich označiť ako voliteľné.

Dôvod: unlock má maximalizovať verified rate, nie dokončiť celý sales discovery.

### 9.2 Firemný e-mail

Nezakazovať Gmail ani osobné adresy.

Pridať jemný signál:

> Firemný e-mail nám pomôže pripraviť relevantnejšie odporúčanie.

### 9.3 Eventy

```text
unlock_form_viewed
unlock_started
unlock_submitted
email_sent
email_delivery_failed
email_confirmation_viewed
email_confirmed
```

## Akceptácia

- verified rate sa dá zmerať,
- formulár nemá viac povinných polí než e-mail,
- scanner-resistant flow zostáva zachovaný,
- marketing consent zostáva oddelený.

---

# 10. Krok 7 — Celý report

## Nové poradie obsahu

1. Executive Summary
2. Money Leak Map
3. Skóre, coverage a confidence
4. Top prioritné findings
5. Silné stránky
6. Kategórie
7. Celý zoznam findings
8. ROI model
9. Qualification
10. DCZ solution
11. Case study
12. Booking
13. Opportunity Brief
14. Methodology a limits

## Úprava komponentov

Rozdeliť súčasný `ReportView`:

```text
src/components/audit/report-header.tsx
src/components/audit/report-findings.tsx
src/components/audit/report-strengths.tsx
src/components/revenue/executive-preview.tsx
src/components/revenue/money-leak-map.tsx
src/components/revenue/roi-scenario-builder.tsx
src/components/revenue/qualification-form.tsx
src/components/revenue/contextual-offer.tsx
src/components/revenue/relevant-case-study.tsx
src/components/revenue/booking-cta.tsx
src/components/revenue/opportunity-brief-cta.tsx
```

Súčasný `ReportView` zostane orchestration komponent.

## Sticky navigation

Na desktop:

```text
Súhrn | Úniky | Zistenia | ROI | Riešenie | Hovor
```

Na mobile:

- kompaktný progress/status,
- bez horizontálneho overflow.

## Akceptácia

- top business insight je nad technickými detailmi,
- report má jasný príbeh,
- high-intent CTA sa opakuje iba na relevantných miestach,
- žiadna sekcia nezablokuje čítanie predchádzajúcej hodnoty.

---

# 11. Krok 8 — ROI scenáre

## Cieľ

Umožniť používateľovi modelovať obchodný potenciál bez falošnej presnosti.

## Vstupy

ROI modul nie je súčasť 3 kvalifikačných otázok. Má vlastné ekonomické vstupy:

1. mesačná návštevnosť alebo počet relevantných návštev,
2. počet dopytov/rezervácií/objednávok mesačne,
3. priemerná hodnota zákazky alebo zákazníka,
4. close rate alebo úspešnosť premeny,
5. voliteľne hrubá marža.

Použiť rozsahy a možnosť „neviem“.

## Model

### Baseline

```text
estimated_closed_customers = monthly_leads × close_rate
estimated_revenue = estimated_closed_customers × average_deal_value
```

### Scenáre

- konzervatívny,
- realistický,
- rastový.

Zlepšenie sa nemá automaticky tvrdiť. Použiť nastaviteľné modelové rozpätie:

```text
+5 % / +10 % / +20 % kvalifikovaných konverzií
```

Používateľ musí vidieť, že ide o scenár.

## Výstup

```ts
interface RoiScenario {
  baselineMonthlyValue: number | null;
  conservativeAnnualPotential: Range | null;
  realisticAnnualPotential: Range | null;
  growthAnnualPotential: Range | null;
  assumptions: string[];
  disclaimer: string;
}
```

## Dátový model

Nová tabuľka:

```text
roi_scenarios
```

Polia:

```text
id
audit_id
lead_id
currency
monthly_visitors
monthly_leads
average_deal_value
close_rate
gross_margin
scenario_json
completed_at
created_at
updated_at
```

Citlivé obchodné vstupy sa nesmú ukladať do funnel event metadata.

## API

```text
POST /api/audit/[token]/roi
GET  /api/audit/[token]/roi
```

Prístup iba po odomknutí reportu.

## UI copy

> Ide o modelový scenár založený na údajoch, ktoré ste zadali. Nie je to garancia výsledku ani presný výpočet ušlých tržieb.

## Eventy

```text
roi_viewed
roi_started
roi_completed
roi_recalculated
```

## Akceptácia

- nulové a neúplné hodnoty nespôsobia NaN,
- používa sa mena EUR,
- scenár jasne uvádza assumptions,
- sumy nie sú uložené do URL,
- výpočet má unit testy,
- report nikdy nezobrazí sumu bez zadaných vstupov.

---

# 12. Krok 9 — Tri kvalifikačné otázky

## Cieľ

Získať minimum údajov potrebných na rozlíšenie seriózneho high-end projektu od nízkeho fitu.

## Presne tri otázky

### Otázka 1 — obchodný cieľ

> Aký výsledok má váš web prinášať predovšetkým?

Možnosti:

- kvalifikované B2B dopyty,
- rezervácie,
- objednávky/predaj,
- demo alebo konzultácie,
- registrácie/subscription,
- iné.

### Otázka 2 — rozhodovanie a termín

> Kto bude rozhodovať a kedy chcete problém riešiť?

Polia v jednej otázke:

- som rozhodovateľ / spolurozhodujem / pripravujem podklady,
- ihneď / do 30 dní / do 90 dní / neskôr.

### Otázka 3 — rozsah investície

> Aký rozsah riešenia je pre vás realistický, ak sa potvrdí obchodný prínos?

Odporúčané neutrálné pásma:

- do 3 000 €,
- 3 000–7 500 €,
- 7 500–15 000 €,
- 15 000–30 000 €,
- 30 000 €+,
- potrebujem najskôr návrh business case.

Pásma majú byť konfigurovateľné.

## Prečo nepoužiť „koľko máte zamestnancov“

Pre DCZ je dôležitejšie:

- hodnota problému,
- buying authority,
- termín,
- investičná pripravenosť.

## Dátový model

Nová tabuľka:

```text
lead_qualifications
```

Polia:

```text
id
lead_id
audit_id
primary_conversion_goal
decision_role
project_timeline
investment_band
vertical_confirmed
business_model_confirmed
completed_at
created_at
updated_at
```

## API

```text
POST /api/audit/[token]/qualification
GET  /api/audit/[token]/qualification
```

## UX

- iba po odomknutí,
- progress 1/3, 2/3, 3/3,
- klávesnicovo dostupné radio/select controls,
- možnosť „neviem“,
- odpoveď sa priebežne neodosiela; uložiť po dokončení.

## Akceptácia

- tri otázky sa dajú dokončiť do 60 sekúnd,
- výsledok okamžite upraví ponuku,
- completion event je uložený,
- nedokončená kvalifikácia neblokuje celý report.

---

# 13. Krok 10 — Kontextová DCZ ponuka

## Cieľ

Namiesto generického „kontaktujte DCZ“ odporučiť najrelevantnejší typ riešenia.

## Solution registry

Vytvoriť:

```text
src/lib/solutions/catalog.ts
src/lib/solutions/recommendation.ts
```

### Solution tiers

#### 1. Conversion Foundation

Pre:

- slabý CTA,
- slabú dôveru,
- nejasnú kontaktnú cestu,
- menší rozsah.

Obsah:

- messaging,
- conversion UX,
- lead form,
- tracking,
- základné SEO opravy.

#### 2. Growth Funnel

Pre:

- viac bariér,
- vysokú hodnotu leadu,
- rezervácie/demo/quote,
- potrebu automatizácie.

Obsah:

- nový funnel,
- kvalifikácia,
- CRM/e-mail flow,
- analytics,
- integrácie.

#### 3. Revenue Platform

Pre:

- high-value firmu,
- komplexný predaj,
- booking/order/payment,
- viac rolí,
- vysoký fit a intent.

Obsah:

- custom web aplikácia,
- rezervácie/platby,
- admin,
- CRM,
- automatizácie,
- reporting.

## Recommendation engine

Vstupy:

- top Money Leaks,
- vertical,
- business model,
- ROI inputs,
- qualification,
- fit/intent score.

Výstup:

```ts
interface SolutionRecommendation {
  solutionId: string;
  title: string;
  rationale: string[];
  recommendedModules: string[];
  excludedModules: string[];
  effortBand: string;
  nextStepLabel: string;
}
```

## Cena

V P0 neuvádzať automatickú záväznú cenu.

Možno zobraziť:

- orientačný scope,
- „od“ iba po schválení DCZ,
- alebo investičný level bez sumy.

## Akceptácia

- ponuka sa mení podľa dát,
- rationale uvádza 2–4 konkrétne dôvody,
- neodporúča Revenue Platform nízkemu fitu bez vysvetlenia,
- CTA odkazuje na booking alebo opportunity brief.

---

# 14. Krok 11 — Relevantná case study

## Kritické pravidlo

Zobrazovať iba obsah s pravdivým typom:

```ts
type ProofType = "verified_client_result" | "delivered_project" | "demo" | "concept";
```

Nikdy neprezentovať demo ako platený klientsky výsledok.

## Case study registry

Vytvoriť:

```text
src/content/case-studies.ts
src/lib/case-studies/match.ts
src/components/revenue/relevant-case-study.tsx
```

Polia:

```ts
interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  verticals: BusinessVertical[];
  problems: MoneyLeakCategory[];
  solutionIds: string[];
  proofType: ProofType;
  clientName?: string;
  summary: string;
  challenge: string;
  implemented: string[];
  verifiedResults?: string[];
  disclaimer?: string;
  url: string;
}
```

## Matching

Priorita:

1. rovnaká vertikála,
2. rovnaký money leak,
3. rovnaký solution tier,
4. verified result pred demo,
5. žiadny relevantný dôkaz → nezobraziť falošnú relevanciu.

## UI copy

Verified:

> Podobný problém sme riešili pri…

Demo/koncept:

> Pozrite si modelový návrh riešenia podobného problému.

## Eventy

```text
case_study_impression
case_study_opened
case_study_cta_clicked
```

## Akceptácia

- každý dôkaz má typ,
- neoverené čísla sa nezobrazia,
- case study sa zobrazuje iba pri relevantnom match,
- admin vie upraviť registry bez zásahu do scoringu.

---

# 15. Krok 12 — Rezervácia diagnostického hovoru

## Cieľ

Premeniť high-intent lead na konkrétny kalendárny termín.

## MVP integrácia

Použiť externý scheduling provider:

- Cal.com,
- Calendly,
- alebo vlastnú Google Calendar booking page.

Provider URL uložiť v:

```text
DIAGNOSTIC_BOOKING_URL
```

## Bezpečný redirect

Nevkladať citlivé údaje do query parametrov.

Vytvoriť:

```text
GET /book/[token]
```

Route:

1. overí audit access,
2. vytvorí `booking_intent`,
3. zaznamená event,
4. vytvorí krátkodobý podpísaný context token,
5. presmeruje na booking URL.

Ak provider podporuje custom questions, preniesť iba:

- audit reference ID,
- doménu,
- solution tier.

Nie raw ROI hodnoty ani interné lead score.

## Dátový model

```text
booking_intents
```

Polia:

```text
id
lead_id
audit_id
provider
status
context_token_hash
clicked_at
booked_at
cancelled_at
provider_event_id
created_at
updated_at
```

## Booking completion

P0:

- kliknutie sa zaznamená,
- admin manuálne označí booked.

P1:

- webhook z Cal.com/Calendly,
- status `booked`,
- dátum hovoru,
- automatický admin task.

## CTA

> Rezervovať 20-minútovú diagnostiku výsledku

Helper:

> Na hovore prejdeme tri najväčšie bariéry, overíme obchodný kontext a povieme, či má zmysel riešenie od DCZ.

## Akceptácia

- booking click je trackovaný,
- PII nie je v URL,
- booking je dostupný iba overenému leadu,
- booked lead má najvyšší intent signál.

---

# 16. Krok 13 — Opportunity Brief

## Cieľ

Vytvoriť stručný executive dokument, ktorý môže lead:

- uložiť,
- preposlať kolegovi,
- použiť ako podklad na interné rozhodnutie.

## P0 forma

Webová stránka:

```text
/audit/[token]/brief
```

PDF export je P1.

## Obsah

1. firma/doména,
2. dátum diagnostiky,
3. executive summary,
4. top 3 Money Leaks,
5. ROI scenáre,
6. potvrdené kvalifikačné odpovede,
7. odporúčaná DCZ solution,
8. relevantná case study,
9. ďalší krok,
10. methodology disclaimer.

## Generovanie

Deterministické. Používa iba:

- audit report,
- evidence,
- ROI scenario,
- qualification,
- solution recommendation,
- case study registry.

## Dátový model

```text
opportunity_briefs
```

Polia:

```text
id
audit_id
lead_id
version
brief_json
public_token_hash
generated_at
expires_at
last_viewed_at
created_at
```

## Share access

- brief link je tokenized,
- noindex,
- možnosť revoke,
- bez admin interných score dôvodov.

## E-mail

Po vytvorení:

> Vaše zhrnutie obchodných príležitostí je pripravené.

## Eventy

```text
brief_generated
brief_viewed
brief_shared
brief_booking_clicked
```

## Akceptácia

- brief je čitateľný za 3–5 minút,
- neobsahuje neoverené tvrdenia,
- je vhodný pre CEO/CFO/marketing,
- share link neodhaľuje PII v URL.

---

# 17. Krok 14 — Lead scoring a admin routing

## Aktuálny stav

Súčasné skóre:

- 42 bodov za unlock,
- 70 bodov za manual review,
- bonus za firmu, telefón, cieľ a nízke audit score.

Je použiteľné ako MVP, ale nerozlišuje:

- kvalitu firmy,
- buying authority,
- ekonomický potenciál,
- reálny intent.

## Nový model

### Company Fit Score — 0 až 50

Príklad:

| Signál | Body |
|---|---:|
| firma uvedená | +4 |
| firemný e-mail | +4 |
| cieľová vertikála | +8 |
| avg. deal value 1 000 €+ | +7 |
| avg. deal value 5 000 €+ | +5 navyše |
| investičný band 7 500 €+ | +8 |
| rozhodovateľ/spolurozhodovateľ | +8 |
| relevantný business model | +6 |

### Buying Intent Score — 0 až 50

| Správanie | Body |
|---|---:|
| e-mail overený | +6 |
| full report viewed | +4 |
| ROI started | +4 |
| ROI completed | +8 |
| qualification completed | +8 |
| case study opened | +3 |
| brief generated/viewed | +5 |
| booking clicked | +5 |
| booking completed | +12 |
| manual review requested | +10 |

Skóre limitovať na 50.

### Priority

```text
A — 75 až 100 alebo booked call
B — 55 až 74
C — 35 až 54
Nurture — pod 35
Disqualified — manuálne
```

### Urgent routing

Okamžitá notifikácia, keď:

- booking completed,
- Fit ≥ 35 a Intent ≥ 25,
- investment band ≥ 15 000 € a timeline ≤ 90 dní,
- manual review + decision maker.

## Dátový model

Do `leads` pridať:

```text
fit_score
intent_score
priority
score_reasons_json
last_scored_at
routing_status
```

Pôvodné `leadScore` možno ponechať ako computed total počas migrácie.

## Scoring service

```text
src/lib/leads/fit-score.ts
src/lib/leads/intent-score.ts
src/lib/leads/priority.ts
src/lib/leads/recalculate.ts
```

Každá relevantná udalosť spustí idempotentný prepočet.

## Admin

Dashboard:

- Priority A queue,
- upcoming calls,
- overdue next actions,
- high fit/no booking,
- ROI completed/no qualification,
- email verified/no report return.

Lead detail:

- Fit Score,
- Intent Score,
- reasons,
- ROI summary,
- qualification,
- recommended solution,
- case study interaction,
- booking status,
- follow-up history.

## Akceptácia

- score má vysvetliteľné reasons,
- admin vie vidieť, prečo je lead prioritný,
- priority A nie je založená iba na nízkom web score,
- booked call sa okamžite routuje.

---

# 18. Krok 15 — Personalizovaný follow-up

## Cieľ

Nenechať kvalitný lead zaniknúť po prvom otvorení reportu.

## Právne oddelenie

### Service follow-up

Možno poslať v súvislosti s:

- vyžiadaným auditom,
- vytvoreným briefom,
- manuálnou kontrolou,
- bookingom.

### Marketing follow-up

Iba pri platnom marketing consent.

Systém musí tieto dva typy oddeliť.

## Follow-up jobs

Nová tabuľka:

```text
follow_up_jobs
```

Polia:

```text
id
lead_id
audit_id
kind
status
scheduled_for
sent_at
cancelled_at
attempt_count
last_error
template_version
context_json
created_at
updated_at
```

## P0 sekvencia

### E-mail 0 — okamžite

Po verified e-maile:

- celý report,
- top risk,
- CTA na ROI.

### E-mail 1 — po 24 hodinách

Podmienka:

- full report viewed,
- ROI nedokončené,
- žiadny booking.

Obsah:

> Doplňte tri čísla a pozrite si modelový obchodný potenciál.

### E-mail 2 — po 72 hodinách

Podmienka:

- ROI dokončené,
- qualification nedokončená.

Obsah:

> Doplňte tri otázky, aby sme vám ukázali relevantný typ riešenia.

### E-mail 3 — po 4–5 dňoch

Podmienka:

- qualification hotová,
- booking nie.

Obsah:

- contextual solution,
- relevantná case study,
- booking CTA.

### E-mail 4 — po 7–10 dňoch

Podmienka:

- high fit,
- žiadny booking ani manual review.

Obsah:

- stručné close-the-loop,
- žiadny falošný scarcity,
- možnosť odpovedať priamo.

## Stop conditions

Zrušiť plánované follow-ups pri:

- booked call,
- lead stage `contacted`, `proposal`, `won`, `lost`,
- unsubscribe,
- hard bounce,
- manuálne stop v adminovi.

## Cron

```text
/api/cron/follow-ups
```

Chránený `CRON_SECRET`.

## Personalizácia

Použiť:

- doménu,
- top Money Leak,
- ROI scenario range,
- solution recommendation,
- case study,
- booking link.

Nepoužiť generatívne tvrdenia bez evidence.

## Eventy

```text
follow_up_scheduled
follow_up_sent
follow_up_failed
follow_up_link_clicked
follow_up_cancelled
```

## Akceptácia

- e-mail nie je odoslaný po booking,
- consent pravidlá sú rešpektované,
- template obsahuje unsubscribe pre marketing,
- admin vidí históriu,
- retry má max pokusy.

---

# 19. Databázová migrácia

Vytvoriť:

```text
drizzle/0003_high_end_revenue_funnel.sql
```

## Nové tabuľky

```text
audit_business_profiles
roi_scenarios
lead_qualifications
booking_intents
opportunity_briefs
follow_up_jobs
```

## Rozšírenie leads

```text
fit_score
intent_score
priority
score_reasons_json
routing_status
vertical
business_model
investment_band
decision_role
project_timeline
```

## Indexy

```text
leads_priority_idx
leads_fit_score_idx
leads_intent_score_idx
leads_routing_status_idx
booking_intents_status_idx
follow_up_jobs_schedule_idx
opportunity_briefs_expiry_idx
```

## Retention

- ROI a qualification: podľa lead retention,
- opportunity brief: 90–180 dní alebo podľa používateľského prístupu,
- follow-up jobs: 180 dní po ukončení,
- booking: podľa obchodnej evidencie,
- funnel events: existujúcich 180 dní.

---

# 20. Nové API routy

```text
POST /api/audit/[token]/roi
GET  /api/audit/[token]/roi

POST /api/audit/[token]/qualification
GET  /api/audit/[token]/qualification

GET  /api/audit/[token]/recommendation

POST /api/audit/[token]/brief
GET  /api/audit/[token]/brief

GET  /book/[token]

POST /api/booking/webhook
POST /api/cron/follow-ups
```

Všetky citlivé endpointy:

- same-origin check tam, kde je relevantný,
- rate limit,
- access cookie,
- body limit,
- Zod validation,
- safe public errors,
- correlation ID,
- telemetry best-effort.

---

# 21. Funnel event taxonomy

## Acquisition

```text
landing_viewed
url_field_focused
audit_submit_attempted
audit_started
```

## Processing

```text
audit_processing_started
audit_completed
audit_failed
```

## Preview

```text
partial_result_viewed
executive_preview_viewed
money_leak_teaser_viewed
```

## Unlock

```text
unlock_form_viewed
unlock_submitted
email_sent
email_confirmation_viewed
result_email_confirmed
```

## Full report

```text
full_result_viewed
money_leak_map_viewed
finding_expanded
```

## ROI

```text
roi_viewed
roi_started
roi_completed
roi_recalculated
```

## Qualification

```text
qualification_started
qualification_completed
```

## Solution/proof

```text
solution_recommendation_viewed
case_study_impression
case_study_opened
```

## Conversion

```text
booking_clicked
booking_completed
manual_review_requested
brief_generated
brief_viewed
```

## Follow-up

```text
follow_up_scheduled
follow_up_sent
follow_up_link_clicked
follow_up_cancelled
```

PII sa nesmie ukladať do `metadata`.

---

# 22. Admin dashboard v2

## Hlavné KPI

- audits started,
- completion rate,
- partial result view rate,
- unlock rate,
- verified rate,
- full report rate,
- ROI completion rate,
- qualification completion rate,
- booking click rate,
- booked call rate,
- Priority A count,
- manual review rate,
- lead-to-call conversion.

## Fronty

### Hot leads

- booked,
- Priority A,
- manual review,
- high ROI potential + short timeline.

### Needs action

- verified, no full view,
- full view, no ROI,
- ROI, no qualification,
- qualification, no booking,
- overdue next action.

### Nurture

- low intent,
- longer timeline,
- marketing consent.

## Lead detail

Sekcie:

1. contact,
2. company/business context,
3. audit summary,
4. money leaks,
5. ROI,
6. qualification,
7. solution recommendation,
8. case study interaction,
9. booking,
10. follow-up timeline,
11. notes/actions.

---

# 23. UI/UX systém

## Vizuálny smer

Zachovať:

- dark premium SaaS,
- modro-fialové akcenty,
- glass/dimensional cards,
- jasnú typografickú hierarchiu.

Optimalizovať:

- menej rovnakých kariet,
- viac executive whitespace,
- zvýrazniť iba jednu primárnu akciu na sekciu,
- žiadne agresívne glow efekty,
- jasný difference medzi evidence a interpretation.

## Stavové farby

Používať farbu spolu s textom/ikonou:

- kritické,
- vysoké,
- stredné,
- nízke,
- unknown.

## Accessibility

- 44 px touch targets,
- viditeľný focus,
- semantic form controls,
- `aria-live` pre ROI a qualification,
- reduced motion,
- WCAG AA contrast,
- 375 px mobile test.

---

# 24. E-mailové šablóny

Vytvoriť:

```text
src/lib/email/templates/report-ready.ts
src/lib/email/templates/roi-reminder.ts
src/lib/email/templates/qualification-reminder.ts
src/lib/email/templates/contextual-solution.ts
src/lib/email/templates/opportunity-brief.ts
src/lib/email/templates/booking-confirmation.ts
src/lib/email/templates/close-loop.ts
```

Každá šablóna:

- subject bez clickbaitu,
- doména klienta,
- jeden hlavný insight,
- jeden CTA,
- disclaimer tam, kde sú ROI sumy,
- reply-to lead owner/DCZ,
- textová aj HTML verzia.

---

# 25. Testovací plán

## Unit

- Money Leak mapping,
- vertical inference,
- business model inference,
- ROI calculations,
- ROI ranges,
- zero/unknown values,
- qualification validation,
- solution recommendation,
- case study matching,
- Fit Score,
- Intent Score,
- priority routing,
- follow-up eligibility,
- stop conditions.

## Integration

- partial report obsahuje executive teaser,
- verified report zobrazí full Money Leak Map,
- ROI uloženie,
- qualification uloženie,
- recommendation update,
- brief generation,
- booking intent,
- follow-up scheduling,
- booked call cancels follow-ups,
- admin priority update.

## E2E

1. low-data website,
2. B2B SaaS,
3. booking business,
4. developer,
5. personal e-mail lead,
6. company e-mail high-fit lead,
7. ROI unknown values,
8. booked call path,
9. mobile full flow,
10. keyboard-only flow.

## Security

- ROI/qualification API bez access cookie,
- tampered audit token,
- oversized values,
- XSS strings,
- PII leakage in URL,
- booking redirect validation,
- webhook signature validation,
- cron secret,
- brief token expiry.

---

# 26. Implementačné fázy

## Fáza A — Baseline a migrácia

1. vytvoriť lockfile,
2. green baseline,
3. migration 0003,
4. nové TypeScript types,
5. event taxonomy.

**Akceptácia:** súčasný funnel stále funguje bez nových modulov.

## Fáza B — Executive Preview a Money Leak Map

1. executive summary service,
2. money leak mapping,
3. partial teaser,
4. full map,
5. tests.

**Akceptácia:** decision maker rozumie top problému bez čítania všetkých findings.

## Fáza C — ROI model

1. schema,
2. calculations,
3. API,
4. UI,
5. persistence,
6. tests.

**Akceptácia:** model zobrazuje tri scenáre a jasné assumptions.

## Fáza D — Qualification a scoring

1. 3 questions,
2. Fit Score,
3. Intent Score,
4. priority,
5. admin display.

**Akceptácia:** high-fit/high-intent lead sa automaticky označí Priority A.

## Fáza E — Solution a case study

1. solution catalog,
2. recommendation engine,
3. case study registry,
4. matching,
5. contextual UI.

**Akceptácia:** odporúčanie má jasné reasons a relevantný proof type.

## Fáza F — Booking a Opportunity Brief

1. booking redirect,
2. booking intent,
3. provider integration,
4. brief generator,
5. tokenized brief page,
6. e-mail.

**Akceptácia:** lead vie prejsť z reportu na rezervovaný hovor s preneseným kontextom.

## Fáza G — Follow-up automation

1. follow-up jobs,
2. cron,
3. templates,
4. stop conditions,
5. admin history.

**Akceptácia:** žiadny e-mail po booked call a žiadny marketing bez consent.

## Fáza H — Analytics/admin v2

1. funnel KPI,
2. queues,
3. routing,
4. next actions,
5. monitoring.

**Akceptácia:** DCZ vidí, koho kontaktovať ako prvého a prečo.

## Fáza I — QA a final release

1. unit/integration/E2E,
2. mobile QA,
3. email QA,
4. booking QA,
5. staging,
6. calibration,
7. final ZIP.

---

# 27. Definition of Done

## Funnel

- [ ] URL submit funguje.
- [ ] Audit je reálny a evidence-backed.
- [ ] Executive preview existuje.
- [ ] Money Leak Map existuje.
- [ ] Unlock a verification fungujú.
- [ ] Full report je chránený.
- [ ] ROI má tri scenáre.
- [ ] Qualification má presne tri otázky.
- [ ] DCZ offer je kontextová.
- [ ] Case study je relevantná a pravdivo označená.
- [ ] Booking je trackovaný.
- [ ] Opportunity Brief je vygenerovaný.
- [ ] Fit/Intent scoring funguje.
- [ ] Priority routing funguje.
- [ ] Follow-up rešpektuje stop conditions.

## Trust

- [ ] Žiadne falošné finančné tvrdenia.
- [ ] Každý money leak má evidence.
- [ ] ROI má assumptions a disclaimer.
- [ ] Demo nie je prezentované ako klientsky výsledok.
- [ ] Personalizácia nevymýšľa dáta.

## Security

- [ ] SSRF regresné testy PASS.
- [ ] Access protection PASS.
- [ ] PII nie je v URL.
- [ ] Webhook signatures PASS.
- [ ] Cron secret PASS.
- [ ] Rate limits PASS.
- [ ] Noindex citlivých stránok PASS.

## Build

- [ ] `package-lock.json`.
- [ ] `npm ci` PASS.
- [ ] lint PASS.
- [ ] typecheck PASS.
- [ ] tests PASS.
- [ ] build PASS.
- [ ] GitHub Actions green.
- [ ] no secrets.

## Business

- [ ] Priority A notification.
- [ ] booking context.
- [ ] opportunity brief.
- [ ] admin action queue.
- [ ] conversion metrics.
- [ ] follow-up timeline.

---

# 28. Finálna štruktúra používateľského toku

## 1. URL formulár

Používateľ zadá web bez ďalších povinných údajov.

## 2. Reálny audit

Systém bezpečne získa a vyhodnotí verejné evidence.

## 3. Executive preview

Používateľ uvidí najväčšie riziko, príležitosť a odporúčaný prvý krok.

## 4. Money Leak Map

Používateľ pochopí, v ktorej časti cesty môže web brzdiť obchod.

## 5. E-mailový unlock

Používateľ zadá e-mail na doručenie celého výsledku.

## 6. Overenie e-mailu

Vedomým potvrdením odomkne svoj report.

## 7. Celý report

Získa findings, strengths, evidence, priority a limity.

## 8. ROI scenáre

Doplní ekonomické vstupy a uvidí modelové scenáre.

## 9. 3 kvalifikačné otázky

Doplní cieľ, rozhodovanie/termín a investičnú pripravenosť.

## 10. Kontextová DCZ ponuka

Systém odporučí relevantný solution tier a moduly.

## 11. Relevantná case study

Zobrazí sa najbližší overený dôkaz alebo transparentne označené demo.

## 12. Rezervácia diagnostického hovoru

Lead rezervuje krátky call s auditným kontextom.

## 13. Opportunity Brief

Dostane executive podklad na interné rozhodnutie.

## 14. Lead scoring a admin routing

DCZ dostane Fit Score, Intent Score, priority a reasons.

## 15. Personalizovaný follow-up

Systém pokračuje podľa správania a zastaví sa pri kontakte alebo bookingu.

---

# 29. Finálny verdikt

Súčasný DCZ WebAudit MVP v3 je vhodný základ. Netreba ho prepisovať.

Najväčšia obchodná hodnota ďalšej verzie nevznikne pridaním desiatok ďalších technických kontrol. Vznikne tým, že existujúce evidence preložíme do:

- executive rozhodnutia,
- Money Leak Map,
- modelového ROI,
- kvalifikácie,
- relevantného riešenia,
- dôkazu,
- rezervácie,
- opportunity briefu,
- inteligentného routingu,
- follow-upu.

Po aplikovaní tohto plánu nebude DCZ WebAudit iba auditovací formulár. Bude to prémiový digitálny obchodný konzultant, ktorý:

```text
získa pozornosť
→ ukáže problém
→ vysvetlí obchodný mechanizmus
→ modeluje potenciál
→ overí fit a intent
→ odporučí riešenie
→ poskytne dôkaz
→ rezervuje hovor
→ pripraví DCZ na predaj
```

To je cieľová high-end verzia vhodná na získavanie serióznych klientov pre DCZ.
