import { describe, expect, it } from 'vitest';
import { calculateRoiScenarios } from '@/lib/revenue/roi';

describe('calculateRoiScenarios', () => {
  it('calculates transparent annual ranges', () => {
    const result = calculateRoiScenarios({ monthlyVisitors: 2000, monthlyConversions: 10, averageCustomerValue: 5000, closeRate: 20, grossMargin: 50, currency: 'EUR' });
    expect(result.baselineMonthlyValue).toBe(10000);
    expect(result.observedConversionRate).toBe(0.5);
    expect(result.realisticAnnualPotential).toEqual({ min: 4800, max: 7200 });
  });
  it('does not invent values with incomplete inputs', () => {
    const result = calculateRoiScenarios({ monthlyVisitors: null, monthlyConversions: null, averageCustomerValue: null, closeRate: null, grossMargin: null, currency: 'EUR' });
    expect(result.baselineMonthlyValue).toBeNull();
    expect(result.growthAnnualPotential).toBeNull();
  });
});
