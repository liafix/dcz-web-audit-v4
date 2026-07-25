# DCZ Revenue Diagnostic v4 — manuálne staging QA

## Predpoklady

- green `npm ci --include=dev --no-audit --no-fund && npm run check`,
- aplikované migrácie `0000` až `0004`,
- testovacia PostgreSQL databáza,
- funkčný Resend odosielateľ,
- Turnstile testovacie alebo produkčné kľúče,
- nastavený booking provider,
- noindex staging prostredie.

## Kritický funnel

- [ ] Homepage sa načíta bez client/server chyby.
- [ ] URL formulár prijme platnú verejnú HTTPS URL.
- [ ] Localhost, private a metadata adresy sú odmietnuté.
- [ ] Progress zobrazuje reálne etapy a skončí na výsledku.
- [ ] Stale audit sa idempotentne obnoví.
- [ ] Hostinger proxy nepreruší audit pred 50-sekundovým aplikačným deadline.
- [ ] Executive preview zodpovedá evidence.
- [ ] Money Leak Map neobsahuje nepodložené finančné sumy.
- [ ] Unlock vytvorí pending lead a odošle e-mail.
- [ ] Samotné GET otvorenie magic linku e-mail neoverí.
- [ ] POST potvrdenie odomkne report.
- [ ] Celý report je bez access grantu neprístupný.
- [ ] ROI scenáre zvládnu úplné, čiastočné aj neznáme vstupy.
- [ ] Kvalifikácia obsahuje presne tri otázky.
- [ ] Kontextová ponuka zodpovedá Money Leaks a kvalifikácii.
- [ ] Case study je označená ako overený výsledok, dodaný projekt, demo alebo koncept.
- [ ] Booking click vytvorí booking intent bez PII v URL.
- [ ] Opportunity Brief je noindex, tokenized a bez interných admin údajov.
- [ ] Fit Score, Intent Score a priority sa prepočítajú.
- [ ] Priority A lead vytvorí správnu DCZ notifikáciu.
- [ ] Follow-up sa zastaví po bookingu alebo zmene lead stage.
- [ ] Dva súbežné follow-up cron requesty neodošlú tú istú úlohu dvakrát.
- [ ] Expirovaný processing lease sa bezpečne znovu zaradí.

## E-mail

- [ ] Report-ready e-mail má textovú aj HTML verziu.
- [ ] Link funguje na inom zariadení/prehliadači.
- [ ] ROI reminder smeruje cez nový access token.
- [ ] Marketingový follow-up obsahuje odhlásenie.
- [ ] Service a marketing follow-up sú právne oddelené.
- [ ] Hard failure sa zaloguje a nepoškodí audit.

## Admin

- [ ] Login rate limit funguje.
- [ ] Lead detail zobrazuje audit, Money Leaks, ROI a kvalifikáciu.
- [ ] Owner, stage, note a next action sa dajú uložiť.
- [ ] Booking sa dá manuálne označiť ako booked/cancelled.
- [ ] Priority dôvody sú vysvetliteľné.
- [ ] Admin a API odpovede majú `no-store` a `noindex` ochranu.
- [ ] Forged Host/Origin kombinácia je v live production odmietnutá.

## Responzivita a prístupnosť

- [ ] 375 × 812.
- [ ] 390 × 844.
- [ ] 768 × 1024.
- [ ] 1024 × 768.
- [ ] 1440 × 900.
- [ ] Keyboard-only flow.
- [ ] Viditeľný focus.
- [ ] Bez horizontálneho overflow.
- [ ] Reduced motion.
- [ ] Hlavné kontrasty spĺňajú WCAG AA.

## Release rozhodnutie

Produkčný soft launch je povolený až po splnení všetkých kritických bodov a po úspešnom spracovaní minimálne 10 interných/staging auditov bez straty leadu alebo nekonečného progressu.
