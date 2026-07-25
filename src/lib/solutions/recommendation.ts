import { SOLUTION_CATALOG } from '@/lib/solutions/catalog';
import type {
  BusinessProfile,
  MoneyLeak,
  QualificationInput,
  RoiScenarioResult,
  SolutionId,
  SolutionRecommendation,
} from '@/lib/revenue/types';

function chooseSolution(input: {
  leaks: MoneyLeak[];
  profile: BusinessProfile;
  qualification: QualificationInput | null;
  roi: RoiScenarioResult | null;
}): SolutionId {
  const critical = input.leaks.filter((leak) => ['critical', 'high'].includes(leak.severity)).length;
  const platformBand = ['15000_30000', '30000_plus'].includes(input.qualification?.investmentBand ?? '');
  const growthBand = ['7500_15000', 'business_case_first'].includes(input.qualification?.investmentBand ?? '');
  const transactionHeavy = ['booking', 'ecommerce', 'subscription'].includes(input.profile.businessModel);
  if ((platformBand && transactionHeavy) || (platformBand && critical >= 3)) return 'revenue_platform';
  if (growthBand || critical >= 2 || input.roi?.realisticAnnualPotential?.max && input.roi.realisticAnnualPotential.max >= 10000) return 'growth_funnel';
  return 'conversion_foundation';
}

export function recommendSolution(input: {
  leaks: MoneyLeak[];
  profile: BusinessProfile;
  qualification: QualificationInput | null;
  roi: RoiScenarioResult | null;
}): SolutionRecommendation {
  const solutionId = chooseSolution(input);
  const catalog = SOLUTION_CATALOG[solutionId];
  const topLeaks = input.leaks.filter((leak) => leak.status !== 'UNKNOWN').slice(0, 3);
  const rationale = topLeaks.map((leak) => `${leak.title}: ${leak.blockedBusinessStep}.`);
  if (input.qualification?.projectTimeline === 'immediately' || input.qualification?.projectTimeline === '30_days') {
    rationale.push('Projekt má krátky deklarovaný termín realizácie.');
  }
  if (input.qualification?.decisionRole === 'decision_maker') {
    rationale.push('Diagnostiku vyplnil rozhodovateľ firmy.');
  }
  const excludedModules = solutionId === 'conversion_foundation'
    ? ['Komplexný CRM vývoj bez potvrdenej potreby', 'Platby alebo rezervácie bez obchodného zadania']
    : solutionId === 'growth_funnel'
      ? ['Veľký interný informačný systém bez validácie scope']
      : [];
  return {
    solutionId,
    title: catalog.title,
    summary: catalog.summary,
    rationale: rationale.slice(0, 5),
    recommendedModules: catalog.modules,
    excludedModules,
    effortBand: catalog.effortBand,
    nextStepLabel: catalog.nextStepLabel,
  };
}
