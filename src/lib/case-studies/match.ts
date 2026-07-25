import { CASE_STUDIES } from '@/content/case-studies';
import type { BusinessProfile, CaseStudy, MoneyLeak, SolutionRecommendation } from '@/lib/revenue/types';

const proofRank: Record<CaseStudy['proofType'], number> = {
  verified_client_result: 4,
  delivered_project: 3,
  demo: 2,
  concept: 1,
};

export function matchCaseStudy(input: {
  profile: BusinessProfile;
  leaks: MoneyLeak[];
  recommendation: SolutionRecommendation;
}): CaseStudy | null {
  const leakCategories = new Set(input.leaks.slice(0, 4).map((leak) => leak.category));
  const ranked = CASE_STUDIES.map((study) => {
    const verticalScore = study.verticals.includes(input.profile.vertical) ? 8 : 0;
    const problemScore = study.problems.filter((problem) => leakCategories.has(problem)).length * 3;
    const solutionScore = study.solutionIds.includes(input.recommendation.solutionId) ? 4 : 0;
    return { study, score: verticalScore + problemScore + solutionScore + proofRank[study.proofType] };
  }).sort((a, b) => b.score - a.score);
  return ranked[0] && ranked[0].score >= 6 ? ranked[0].study : null;
}
