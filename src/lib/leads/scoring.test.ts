import { describe, expect, it } from 'vitest';
import { calculateHighEndLeadScore } from '@/lib/leads/scoring';

describe('calculateHighEndLeadScore', () => {
  it('routes a high-fit booked decision maker to priority A', () => {
    const result = calculateHighEndLeadScore({ company: 'Acme', email: 'ceo@acme.sk', emailVerified: true, vertical: 'b2b_saas', businessModel: 'demo_sales', investmentBand: '15000_30000', decisionRole: 'decision_maker', projectTimeline: '30_days', averageCustomerValue: 8000, events: ['full_result_viewed', 'roi_completed', 'qualification_completed', 'booking_clicked'], manualReviewRequested: false, bookingCompleted: true });
    expect(result.priority).toBe('A');
    expect(result.fitScore).toBeGreaterThanOrEqual(35);
    expect(result.intentScore).toBeGreaterThanOrEqual(30);
  });
});
