export type FollowUpKind = 'roi_reminder' | 'qualification_reminder' | 'contextual_solution' | 'close_loop';

export function followUpPolicy(input: {
  kind: string;
  leadStage: string;
  marketingConsent: boolean;
  marketingUnsubscribed: boolean;
  bookingStatus: string | null;
  hasRoi: boolean;
  hasQualification: boolean;
}): { send: boolean; reason: string } {
  if (['contacted', 'qualified', 'proposal', 'won', 'lost'].includes(input.leadStage)) return { send: false, reason: 'sales_stage_active' };
  if (input.bookingStatus === 'booked') return { send: false, reason: 'booking_completed' };
  if (input.kind === 'roi_reminder' && input.hasRoi) return { send: false, reason: 'roi_already_completed' };
  if (input.kind === 'qualification_reminder' && input.hasQualification) return { send: false, reason: 'qualification_already_completed' };
  if (['contextual_solution', 'close_loop'].includes(input.kind) && (!input.marketingConsent || input.marketingUnsubscribed)) {
    return { send: false, reason: 'marketing_consent_missing' };
  }
  return { send: true, reason: 'eligible' };
}
