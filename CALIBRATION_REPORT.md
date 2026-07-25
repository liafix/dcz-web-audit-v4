# Calibration report

## Stav

Produkčná kalibrácia na reálnych weboch nie je súčasťou offline source build procesu a musí prebehnúť na stagingu. Projekt obsahuje unit fixtures a transparentné coverage/confidence, ale verejný marketingový launch vyžaduje manuálne porovnanie.

## Povinná sada

Minimálne 30 webov:

- 5 B2B SaaS,
- 5 developer/reality,
- 5 fitness/wellness,
- 5 hotel/hospitality alebo booking,
- 5 profesionálnych služieb,
- 5 moderných React/Next/SPA alebo e-commerce.

## Pre každý web zaznamenať

- vertikálu a business model,
- automatický finding,
- manuálne potvrdenie,
- false positive/false negative,
- severity,
- Money Leak mapping,
- coverage/confidence,
- relevantnosť odporúčania,
- relevantnosť case study,
- riziko zavádzajúceho ROI textu.

## Launch gate

Platený traffic sa nemá spustiť, kým kritické pravidlá a najčastejšie false positives neprejdú manuálnou kontrolou. Prvých 20–30 auditov má byť kontrolovaný soft launch s ručným dohľadom DCZ.
