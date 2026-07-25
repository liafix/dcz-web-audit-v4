import { describe, expect, it } from 'vitest';
import { matchCaseStudy } from '@/lib/case-studies/match';
import { SOLUTION_CATALOG } from '@/lib/solutions/catalog';
import type { BusinessProfile, MoneyLeak } from '@/lib/revenue/types';

const leak: MoneyLeak = { id: 'x', category: 'transaction', title: 'Rezervačný krok', severity: 'high', certainty: 80, status: 'NOT_DETECTED', mechanism: 'Chýba cesta.', blockedBusinessStep: 'rezerváciu', evidenceIds: [], evidence: [], recommendedFix: 'Doplniť tok.', effortBand: 'large', expectedDirection: 'booking_rate' };
const profile: BusinessProfile = { vertical: 'developer_real_estate', verticalConfidence: 88, businessModel: 'booking', businessModelConfidence: 80, evidence: [] };

describe('matchCaseStudy', () => {
  it('returns a transparently typed relevant proof item', () => {
    const catalog = SOLUTION_CATALOG.revenue_platform;
    const study = matchCaseStudy({ profile, leaks: [leak], recommendation: { solutionId: catalog.id, title: catalog.title, summary: catalog.summary, rationale: [], recommendedModules: catalog.modules, excludedModules: [], effortBand: catalog.effortBand, nextStepLabel: catalog.nextStepLabel } });
    expect(study?.proofType).toBe('concept');
    expect(study?.disclaimer).toBeTruthy();
  });
});
