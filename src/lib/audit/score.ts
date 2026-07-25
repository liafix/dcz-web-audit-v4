import type { AuditCategory, AuditRuleResult } from '@/lib/audit/types';

export const categories: AuditCategory[] = [
  'technical',
  'seo',
  'accessibility',
  'trust',
  'conversion',
  'revenue',
];

const categoryWeights: Record<AuditCategory, number> = {
  technical: 0.22,
  seo: 0.18,
  accessibility: 0.12,
  trust: 0.14,
  conversion: 0.2,
  revenue: 0.14,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateScores(rules: AuditRuleResult[]): {
  overallScore: number | null;
  overallCoverage: number;
  categoryScores: Record<AuditCategory, number | null>;
  categoryCoverage: Record<AuditCategory, number>;
} {
  const categoryScores = {} as Record<AuditCategory, number | null>;
  const categoryCoverage = {} as Record<AuditCategory, number>;

  for (const category of categories) {
    const categoryRules = rules.filter((rule) => rule.category === category && rule.applicable);
    const applicableWeight = categoryRules.reduce((sum, rule) => sum + rule.weight, 0);
    const measuredRules = categoryRules.filter((rule) => rule.measured);
    const measuredWeight = measuredRules.reduce((sum, rule) => sum + rule.weight, 0);
    const scoredRules = measuredRules.filter((rule) => rule.result === 'pass' || rule.result === 'fail');
    const scoredWeight = scoredRules.reduce((sum, rule) => sum + rule.weight, 0);
    const passedWeight = scoredRules
      .filter((rule) => rule.result === 'pass')
      .reduce((sum, rule) => sum + rule.weight, 0);

    const coverage = applicableWeight === 0 ? 0 : clamp((measuredWeight / applicableWeight) * 100);
    categoryCoverage[category] = coverage;
    categoryScores[category] = coverage < 40 || scoredWeight === 0
      ? null
      : clamp((passedWeight / scoredWeight) * 100);
  }

  const overallCoverage = clamp(
    categories.reduce(
      (sum, category) => sum + categoryCoverage[category] * categoryWeights[category],
      0,
    ),
  );
  const scoredCategories = categories.filter((category) => categoryScores[category] !== null);
  const scoredCategoryWeight = scoredCategories.reduce(
    (sum, category) => sum + categoryWeights[category],
    0,
  );
  const overallScore = overallCoverage < 40 || scoredCategoryWeight === 0
    ? null
    : clamp(
        scoredCategories.reduce(
          (sum, category) => sum + (categoryScores[category] ?? 0) * categoryWeights[category],
          0,
        ) / scoredCategoryWeight,
      );

  return { overallScore, overallCoverage, categoryScores, categoryCoverage };
}
