import { describe, expect, it } from 'vitest';
import { followUpPolicy } from '@/lib/follow-up/policy';

const base = { leadStage: 'verified', marketingConsent: true, marketingUnsubscribed: false, bookingStatus: null, hasRoi: false, hasQualification: false };

describe('followUpPolicy', () => {
  it('stops every follow-up after a booked call', () => {
    expect(followUpPolicy({ ...base, kind: 'roi_reminder', bookingStatus: 'booked' }).send).toBe(false);
  });
  it('allows service reminders without marketing consent', () => {
    expect(followUpPolicy({ ...base, kind: 'roi_reminder', marketingConsent: false }).send).toBe(true);
  });
  it('blocks marketing follow-ups without consent', () => {
    expect(followUpPolicy({ ...base, kind: 'contextual_solution', marketingConsent: false }).reason).toBe('marketing_consent_missing');
  });
});
