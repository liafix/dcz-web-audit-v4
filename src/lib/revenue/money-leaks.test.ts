import { describe, expect, it } from 'vitest';
import { buildMoneyLeakMap } from '@/lib/revenue/money-leaks';
import type { AuditFinding } from '@/lib/audit/types';
import type { BusinessProfile } from '@/lib/revenue/types';

const profile: BusinessProfile = { vertical: 'b2b_saas', verticalConfidence: 80, businessModel: 'demo_sales', businessModelConfidence: 78, evidence: [] };
const finding: AuditFinding = { id: 'primary-cta', category: 'conversion', title: 'Chýba dominantná výzva k akcii', status: 'NOT_DETECTED', severity: 'high', confidence: 82, evidence: 'V statickom HTML sa nenašiel jasný CTA text.', impact: 'Návštevník nemusí vedieť, čo urobiť ďalej.', recommendation: 'Pridajte jeden dominantný CTA smerujúci na demo.', sourceUrl: 'https://example.sk/', scoreDelta: -12 };

describe('buildMoneyLeakMap', () => {
  it('translates a finding into a business-stage barrier', () => {
    const leaks = buildMoneyLeakMap([finding], profile);
    expect(leaks[0]?.category).toBe('message_clarity');
    expect(leaks[0]?.blockedBusinessStep).toContain('pochopenie');
    expect(leaks.some((leak) => leak.category === 'follow_up_measurement' && leak.status === 'UNKNOWN')).toBe(true);
  });
});
