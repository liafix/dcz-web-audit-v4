import { describe, expect, it } from 'vitest';
import { recommendSolution } from '@/lib/solutions/recommendation';
import type { BusinessProfile, MoneyLeak } from '@/lib/revenue/types';

const leak: MoneyLeak = { id: 'x', category: 'transaction', title: 'Chýba rezervácia', severity: 'high', certainty: 85, status: 'NOT_DETECTED', mechanism: 'Záujem sa nevie zmeniť na rezerváciu.', blockedBusinessStep: 'rezerváciu', evidenceIds: [], evidence: [], recommendedFix: 'Doplniť rezervačný tok.', effortBand: 'large', expectedDirection: 'booking_rate' };
const profile: BusinessProfile = { vertical: 'developer_real_estate', verticalConfidence: 80, businessModel: 'booking', businessModelConfidence: 80, evidence: [] };

describe('recommendSolution', () => {
  it('recommends a platform only when scope and business model support it', () => {
    const result = recommendSolution({ leaks: [leak, { ...leak, id: 'y' }, { ...leak, id: 'z' }], profile, qualification: { primaryConversionGoal: 'bookings', decisionRole: 'decision_maker', projectTimeline: '30_days', investmentBand: '15000_30000' }, roi: null });
    expect(result.solutionId).toBe('revenue_platform');
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});
