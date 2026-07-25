import { describe, expect, it } from 'vitest';
import { calculateScores } from '@/lib/audit/score';
import type { AuditRuleResult } from '@/lib/audit/types';

const base: AuditRuleResult[] = [
  { id: 'seo-pass', category: 'seo', weight: 8, applicable: true, measured: true, result: 'pass', status: 'OBSERVED' },
  { id: 'seo-fail', category: 'seo', weight: 2, applicable: true, measured: true, result: 'fail', status: 'NOT_DETECTED' },
  { id: 'tech-unknown', category: 'technical', weight: 10, applicable: true, measured: false, result: 'unknown', status: 'UNKNOWN' },
  { id: 'tech-pass', category: 'technical', weight: 5, applicable: true, measured: true, result: 'pass', status: 'OBSERVED' },
];

describe('calculateScores v3', () => {
  it('calculates category score from measured pass/fail weights', () => {
    const result = calculateScores(base);
    expect(result.categoryScores.seo).toBe(80);
  });

  it('reduces coverage for unknown applicable rules without treating them as pass', () => {
    const result = calculateScores(base);
    expect(result.categoryCoverage.technical).toBe(33);
    expect(result.categoryScores.technical).toBeNull();
  });

  it('hides the overall score when weighted coverage is below 40 percent', () => {
    const result = calculateScores([
      { id: 'measured', category: 'seo', weight: 2, applicable: true, measured: true, result: 'fail', status: 'NOT_DETECTED' },
      { id: 'unknown', category: 'seo', weight: 8, applicable: true, measured: false, result: 'unknown', status: 'UNKNOWN' },
    ]);
    expect(result.overallCoverage).toBeLessThan(40);
    expect(result.overallScore).toBeNull();
  });

  it('does not fabricate 100 for a category with no measured rules', () => {
    const result = calculateScores([
      { id: 'unknown', category: 'revenue', weight: 10, applicable: true, measured: false, result: 'unknown', status: 'UNKNOWN' },
    ]);
    expect(result.categoryScores.revenue).toBeNull();
  });
});
