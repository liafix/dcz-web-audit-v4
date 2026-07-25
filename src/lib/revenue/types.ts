import type { FindingSeverity, FindingStatus } from '@/lib/audit/types';

export type BusinessVertical =
  | 'b2b_saas'
  | 'developer_real_estate'
  | 'hotel_hospitality'
  | 'fitness_wellness'
  | 'clinic_health'
  | 'professional_services'
  | 'ecommerce'
  | 'local_service'
  | 'unknown';

export type BusinessModel =
  | 'lead_generation'
  | 'booking'
  | 'ecommerce'
  | 'demo_sales'
  | 'subscription'
  | 'information_only'
  | 'unknown';

export type MoneyLeakCategory =
  | 'traffic_acquisition'
  | 'message_clarity'
  | 'trust'
  | 'conversion'
  | 'transaction'
  | 'follow_up_measurement';

export type ExpectedDirection =
  | 'traffic'
  | 'trust'
  | 'lead_rate'
  | 'booking_rate'
  | 'sales_efficiency';

export interface BusinessProfile {
  vertical: BusinessVertical;
  verticalConfidence: number;
  businessModel: BusinessModel;
  businessModelConfidence: number;
  evidence: string[];
}

export interface MoneyLeak {
  id: string;
  category: MoneyLeakCategory;
  title: string;
  severity: Exclude<FindingSeverity, 'info'> | 'low';
  certainty: number;
  status: FindingStatus;
  mechanism: string;
  blockedBusinessStep: string;
  evidenceIds: string[];
  evidence: string[];
  recommendedFix: string;
  effortBand: 'small' | 'medium' | 'large';
  expectedDirection: ExpectedDirection;
}

export interface ExecutiveSummary {
  headline: string;
  primaryRisk: {
    title: string;
    explanation: string;
    evidenceIds: string[];
  };
  primaryOpportunity: {
    title: string;
    explanation: string;
  };
  firstRecommendedInvestment: {
    title: string;
    reason: string;
  };
  decisionConfidence: number;
}

export interface RoiInputs {
  monthlyVisitors: number | null;
  monthlyConversions: number | null;
  averageCustomerValue: number | null;
  closeRate: number | null;
  grossMargin: number | null;
  currency: 'EUR';
}

export interface RoiRange {
  min: number;
  max: number;
}

export interface RoiScenarioResult {
  baselineMonthlyValue: number | null;
  observedConversionRate: number | null;
  conservativeAnnualPotential: RoiRange | null;
  realisticAnnualPotential: RoiRange | null;
  growthAnnualPotential: RoiRange | null;
  assumptions: string[];
  disclaimer: string;
}

export type PrimaryConversionGoal =
  | 'b2b_leads'
  | 'bookings'
  | 'orders'
  | 'demo_consultations'
  | 'subscriptions'
  | 'other';

export type DecisionRole = 'decision_maker' | 'co_decision_maker' | 'researcher';
export type ProjectTimeline = 'immediately' | '30_days' | '90_days' | 'later';
export type InvestmentBand =
  | 'under_3000'
  | '3000_7500'
  | '7500_15000'
  | '15000_30000'
  | '30000_plus'
  | 'business_case_first';

export interface QualificationInput {
  primaryConversionGoal: PrimaryConversionGoal;
  decisionRole: DecisionRole;
  projectTimeline: ProjectTimeline;
  investmentBand: InvestmentBand;
  verticalConfirmed?: BusinessVertical | null;
  businessModelConfirmed?: BusinessModel | null;
}

export type SolutionId = 'conversion_foundation' | 'growth_funnel' | 'revenue_platform';

export interface SolutionRecommendation {
  solutionId: SolutionId;
  title: string;
  summary: string;
  rationale: string[];
  recommendedModules: string[];
  excludedModules: string[];
  effortBand: 'focused' | 'growth' | 'platform';
  nextStepLabel: string;
}

export type ProofType = 'verified_client_result' | 'delivered_project' | 'demo' | 'concept';

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  verticals: BusinessVertical[];
  problems: MoneyLeakCategory[];
  solutionIds: SolutionId[];
  proofType: ProofType;
  clientName?: string;
  summary: string;
  challenge: string;
  implemented: string[];
  verifiedResults?: string[];
  disclaimer?: string;
}

export type LeadPriority = 'A' | 'B' | 'C' | 'nurture' | 'disqualified';

export interface LeadScoreResult {
  fitScore: number;
  intentScore: number;
  total: number;
  priority: LeadPriority;
  reasons: string[];
}

export interface OpportunityBriefData {
  version: 'revenue-brief-v1';
  generatedAt: string;
  targetUrl: string;
  executiveSummary: ExecutiveSummary;
  moneyLeaks: MoneyLeak[];
  roi: RoiScenarioResult | null;
  qualification: QualificationInput | null;
  recommendation: SolutionRecommendation;
  caseStudy: CaseStudy | null;
  disclaimer: string;
}
