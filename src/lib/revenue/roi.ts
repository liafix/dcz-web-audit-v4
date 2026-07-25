import type { RoiInputs, RoiRange, RoiScenarioResult } from '@/lib/revenue/types';

function finite(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value >= 0 ? value : null;
}

function range(baseAnnual: number, minRate: number, maxRate: number, margin: number): RoiRange {
  return {
    min: Math.round(baseAnnual * minRate * margin),
    max: Math.round(baseAnnual * maxRate * margin),
  };
}

export function calculateRoiScenarios(raw: RoiInputs): RoiScenarioResult {
  const visitors = finite(raw.monthlyVisitors);
  const conversions = finite(raw.monthlyConversions);
  const value = finite(raw.averageCustomerValue);
  const closeRate = finite(raw.closeRate);
  const marginPercent = finite(raw.grossMargin);
  const effectiveCloseRate = closeRate === null ? 1 : Math.min(1, closeRate / 100);
  const margin = marginPercent === null ? 1 : Math.min(1, marginPercent / 100);
  const baselineMonthlyValue = conversions !== null && value !== null
    ? conversions * effectiveCloseRate * value
    : null;
  const annual = baselineMonthlyValue === null ? null : baselineMonthlyValue * 12;
  const observedConversionRate = visitors && conversions !== null
    ? Math.round((conversions / Math.max(1, visitors)) * 10_000) / 100
    : null;
  return {
    baselineMonthlyValue: baselineMonthlyValue === null ? null : Math.round(baselineMonthlyValue),
    observedConversionRate,
    conservativeAnnualPotential: annual === null ? null : range(annual, 0.03, 0.07, margin),
    realisticAnnualPotential: annual === null ? null : range(annual, 0.08, 0.12, margin),
    growthAnnualPotential: annual === null ? null : range(annual, 0.15, 0.25, margin),
    assumptions: [
      'Scenáre modelujú relatívne zvýšenie hodnoty konverzií, nie garantovaný výsledok.',
      closeRate === null ? 'Keďže close rate nebol uvedený, model považuje každú konverziu za výslednú hodnotu.' : `Použitý close rate: ${Math.min(100, closeRate)} %.`,
      marginPercent === null ? 'Výstup je modelovaný ako hodnota tržieb, nie čistý zisk.' : `Potenciál je upravený o zadanú hrubú maržu ${Math.min(100, marginPercent)} %.`,
    ],
    disclaimer: 'Ide o modelový scenár založený na údajoch, ktoré ste zadali. Nie je to garancia výsledku ani presný výpočet ušlých tržieb.',
  };
}
