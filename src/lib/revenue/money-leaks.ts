import type { AuditFinding } from '@/lib/audit/types';
import type { BusinessProfile, MoneyLeak, MoneyLeakCategory } from '@/lib/revenue/types';

const severityRank = { critical: 5, high: 4, medium: 3, low: 2, info: 1 } as const;

function categoryFor(finding: AuditFinding): MoneyLeakCategory {
  if (['title', 'meta-description', 'canonical', 'meta-robots-indexing', 'robots-indexing', 'sitemap', 'pagespeed-seo'].includes(finding.id)) return 'traffic_acquisition';
  if (['h1', 'heading-hierarchy', 'primary-cta', 'cta-repetition', 'javascript-shell-coverage'].includes(finding.id)) return 'message_clarity';
  if (['privacy-link', 'about-link', 'company-identity', 'structured-data', 'security-headers'].includes(finding.id)) return 'trust';
  if (['conversion-contact', 'contact-path', 'lead-form', 'form-labels', 'empty-interactive'].includes(finding.id)) return 'conversion';
  if (['revenue-path', 'contact-fallback'].includes(finding.id)) return 'transaction';
  if (finding.category === 'seo') return 'traffic_acquisition';
  if (finding.category === 'trust') return 'trust';
  if (finding.category === 'conversion') return 'conversion';
  if (finding.category === 'revenue') return 'transaction';
  return 'message_clarity';
}

function blockedStep(category: MoneyLeakCategory): string {
  return {
    traffic_acquisition: 'objavenie webu relevantným návštevníkom',
    message_clarity: 'pochopenie ponuky a ďalšieho kroku',
    trust: 'rozhodnutie dôverovať firme',
    conversion: 'prechod od záujmu ku kontaktu',
    transaction: 'rezerváciu, objednávku alebo kvalifikovaný dopyt',
    follow_up_measurement: 'spracovanie a vyhodnotenie vzniknutého dopytu',
  }[category];
}

function effortFor(finding: AuditFinding): 'small' | 'medium' | 'large' {
  if (['title', 'meta-description', 'language', 'viewport', 'canonical', 'privacy-link'].includes(finding.id)) return 'small';
  if (['primary-cta', 'contact-path', 'lead-form', 'company-identity', 'structured-data'].includes(finding.id)) return 'medium';
  return finding.severity === 'critical' || finding.category === 'revenue' ? 'large' : 'medium';
}

function directionFor(category: MoneyLeakCategory): MoneyLeak['expectedDirection'] {
  const directions: Record<MoneyLeakCategory, MoneyLeak['expectedDirection']> = {
    traffic_acquisition: 'traffic',
    message_clarity: 'lead_rate',
    trust: 'trust',
    conversion: 'lead_rate',
    transaction: 'booking_rate',
    follow_up_measurement: 'sales_efficiency',
  };
  return directions[category];
}

export function buildMoneyLeakMap(findings: AuditFinding[], profile: BusinessProfile): MoneyLeak[] {
  const grouped = new Map<MoneyLeakCategory, AuditFinding[]>();
  for (const finding of findings.filter((item) => item.severity !== 'info')) {
    const category = categoryFor(finding);
    grouped.set(category, [...(grouped.get(category) ?? []), finding]);
  }

  const leaks: MoneyLeak[] = [];
  for (const [category, items] of grouped.entries()) {
    const sorted = [...items].sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.confidence - a.confidence);
    const primary = sorted[0];
    if (!primary) continue;
    leaks.push({
      id: `money-leak-${category}`,
      category,
      title: primary.title,
      severity: primary.severity === 'info' ? 'low' : primary.severity,
      certainty: Math.min(96, Math.round(sorted.slice(0, 3).reduce((sum, item) => sum + item.confidence, 0) / Math.min(3, sorted.length))),
      status: primary.status,
      mechanism: primary.impact,
      blockedBusinessStep: blockedStep(category),
      evidenceIds: sorted.slice(0, 3).map((item) => item.id),
      evidence: sorted.slice(0, 3).map((item) => item.evidence),
      recommendedFix: primary.recommendation,
      effortBand: effortFor(primary),
      expectedDirection: directionFor(category),
    });
  }

  if (!grouped.has('follow_up_measurement')) {
    leaks.push({
      id: 'money-leak-follow-up-unknown',
      category: 'follow_up_measurement',
      title: 'Spracovanie dopytov nebolo možné z verejnej stránky overiť',
      severity: 'low',
      certainty: 32,
      status: 'UNKNOWN',
      mechanism: 'Verejná titulná stránka neukazuje, ako rýchlo sa lead dostane do CRM, kto ho preberie ani ako sa meria výsledok.',
      blockedBusinessStep: blockedStep('follow_up_measurement'),
      evidenceIds: [],
      evidence: ['Táto oblasť vyžaduje kvalifikačnú otázku alebo manuálnu kontrolu.'],
      recommendedFix: 'Overte CRM, meranie konverzií, vlastníctvo leadu a čas prvého follow-upu.',
      effortBand: 'medium',
      expectedDirection: 'sales_efficiency',
    });
  }

  return leaks
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.certainty - a.certainty)
    .slice(0, profile.vertical === 'unknown' ? 5 : 6);
}
