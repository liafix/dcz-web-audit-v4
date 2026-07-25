import type {
  BusinessModel,
  BusinessVertical,
  DecisionRole,
  InvestmentBand,
  LeadPriority,
  LeadScoreResult,
  ProjectTimeline,
} from '@/lib/revenue/types';

export interface LeadScoringInput {
  company: string | null;
  email: string;
  emailVerified: boolean;
  vertical: BusinessVertical | null;
  businessModel: BusinessModel | null;
  investmentBand: InvestmentBand | null;
  decisionRole: DecisionRole | null;
  projectTimeline: ProjectTimeline | null;
  averageCustomerValue: number | null;
  events: string[];
  manualReviewRequested: boolean;
  bookingCompleted: boolean;
}

function isCorporateEmail(email: string): boolean {
  return !/(gmail|googlemail|yahoo|outlook|hotmail|icloud|protonmail|azet|centrum)\./i.test(email.split('@')[1] ?? '');
}

export function calculateHighEndLeadScore(input: LeadScoringInput): LeadScoreResult {
  let fitScore = 0;
  let intentScore = 0;
  const reasons: string[] = [];
  if (input.company) { fitScore += 4; reasons.push('Uvedená firma +4'); }
  if (isCorporateEmail(input.email)) { fitScore += 4; reasons.push('Firemný e-mail +4'); }
  if (input.vertical && ['b2b_saas', 'developer_real_estate', 'hotel_hospitality', 'fitness_wellness', 'clinic_health', 'professional_services', 'ecommerce'].includes(input.vertical)) {
    fitScore += 8; reasons.push('Cieľová vertikála +8');
  }
  if (input.averageCustomerValue !== null && input.averageCustomerValue >= 1000) { fitScore += 7; reasons.push('Hodnota zákazníka 1 000 €+ +7'); }
  if (input.averageCustomerValue !== null && input.averageCustomerValue >= 5000) { fitScore += 5; reasons.push('Hodnota zákazníka 5 000 €+ +5'); }
  if (input.investmentBand && ['7500_15000', '15000_30000', '30000_plus'].includes(input.investmentBand)) { fitScore += 8; reasons.push('Investičná pripravenosť 7 500 €+ +8'); }
  if (input.decisionRole === 'decision_maker' || input.decisionRole === 'co_decision_maker') { fitScore += 8; reasons.push('Rozhodovacia právomoc +8'); }
  if (input.businessModel && input.businessModel !== 'information_only' && input.businessModel !== 'unknown') { fitScore += 6; reasons.push('Relevantný obchodný model +6'); }
  fitScore = Math.min(50, fitScore);

  const events = new Set(input.events);
  if (input.emailVerified) { intentScore += 6; reasons.push('Overený e-mail +6'); }
  if (events.has('full_result_viewed')) { intentScore += 4; reasons.push('Celý report otvorený +4'); }
  if (events.has('roi_started')) { intentScore += 4; reasons.push('ROI začaté +4'); }
  if (events.has('roi_completed')) { intentScore += 8; reasons.push('ROI dokončené +8'); }
  if (events.has('qualification_completed')) { intentScore += 8; reasons.push('Kvalifikácia dokončená +8'); }
  if (events.has('case_study_opened')) { intentScore += 3; reasons.push('Case study otvorená +3'); }
  if (events.has('brief_generated') || events.has('brief_viewed')) { intentScore += 5; reasons.push('Opportunity Brief +5'); }
  if (events.has('booking_clicked')) { intentScore += 5; reasons.push('Klik na rezerváciu +5'); }
  if (input.bookingCompleted) { intentScore += 12; reasons.push('Rezervovaný hovor +12'); }
  if (input.manualReviewRequested) { intentScore += 10; reasons.push('Manuálna kontrola +10'); }
  intentScore = Math.min(50, intentScore);

  const total = fitScore + intentScore;
  let priority: LeadPriority = total >= 75 || input.bookingCompleted ? 'A' : total >= 55 ? 'B' : total >= 35 ? 'C' : 'nurture';
  if (input.investmentBand === 'under_3000' && input.projectTimeline === 'later' && intentScore < 15) priority = 'nurture';
  return { fitScore, intentScore, total, priority, reasons };
}
