import type { AuditEvidence, AuditReport } from '@/lib/audit/types';
import { evaluateRules } from '@/lib/audit/rules';
import { calculateScores } from '@/lib/audit/score';
import { inferBusinessProfile } from '@/lib/revenue/business-profile';
import { buildMoneyLeakMap } from '@/lib/revenue/money-leaks';
import { buildExecutiveSummary } from '@/lib/revenue/executive-summary';

export function buildAuditReport(targetUrl: string, evidence: AuditEvidence): AuditReport {
  const { rules, findings, strengths, opportunities } = evaluateRules(evidence);
  const { overallScore, overallCoverage, categoryScores, categoryCoverage } = calculateScores(rules);
  const applicable = rules.filter((rule) => rule.applicable);
  const measured = applicable.filter((rule) => rule.measured);
  const providerAvailability = evidence.pageSpeed.available ? 1 : 0;
  const sourceQuality = evidence.html.likelyJavascriptShell ? 0.45 : 1;
  const confidence = Math.max(
    20,
    Math.min(
      95,
      Math.round(overallCoverage * 0.72 + sourceQuality * 14 + providerAvailability * 6),
    ),
  );

  const analyzedScope = [
    'Verejná titulná stránka a jej statické HTML',
    'HTTP stav, HTTPS, čas odpovede, veľkosť dokumentu a vybrané bezpečnostné hlavičky',
    'SEO metadata, nadpisy, odkazy, formuláre, prístupnosť a dôveryhodnostné signály',
    'robots.txt a sitemap uvedená v robots.txt alebo na /sitemap.xml',
    evidence.pageSpeed.available
      ? 'Google PageSpeed mobile: výkon, prístupnosť, best practices a SEO'
      : 'PageSpeed nebol dostupný — pravidlá ostali UNKNOWN a neovplyvnili skóre',
  ];

  const businessProfile = inferBusinessProfile(evidence);
  const moneyLeaks = buildMoneyLeakMap(findings, businessProfile);
  const executiveSummary = buildExecutiveSummary(
    { overallScore, overallCoverage, confidence, findings, strengths },
    businessProfile,
    moneyLeaks,
  );

  return {
    version: 'next-mvp-v4',
    generatedAt: new Date().toISOString(),
    targetUrl,
    overallScore,
    overallCoverage,
    confidence,
    categoryScores,
    categoryCoverage,
    findings: findings.sort((a, b) => a.scoreDelta - b.scoreDelta),
    strengths: strengths.slice(0, 14),
    opportunities: opportunities.slice(0, 3),
    businessProfile,
    executiveSummary,
    moneyLeaks,
    limitations: [
      'Diagnostika analyzuje titulnú stránku a verejné technické súbory, nie celý web.',
      'Kontrola nevykonáva prihlásenie, odosielanie formulárov, rezervácie ani platby.',
      'Dynamický obsah vykreslený iba JavaScriptom nemusí byť v statickom HTML viditeľný.',
      evidence.pageSpeed.available
        ? 'PageSpeed je externé meranie a jeho výsledok sa môže medzi behmi meniť.'
        : 'PageSpeed meranie nebolo dostupné; neznáme pravidlá web nepenalizovali.',
      'Výsledok je predbežná diagnostika; zásadné rozhodnutia odporúčame overiť manuálne.',
    ],
    analyzedScope,
    evidenceSummary: {
      pagesAnalyzed: 1,
      externalMetricsAvailable: evidence.pageSpeed.available,
      evidenceItems:
        evidence.html.headings.length +
        evidence.html.links.length +
        evidence.html.schemaTypes.length +
        rules.length,
      likelyJavascriptShell: evidence.html.likelyJavascriptShell,
      rulesApplicable: applicable.length,
      rulesMeasured: measured.length,
    },
  };
}
