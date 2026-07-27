import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  enforceRateLimit: vi.fn(),
  recordFunnelEventSafe: vi.fn(),
  recordSecurityEventSafe: vi.fn(),
  confirmReportAccessToken: vi.fn(),
  findAuditById: vi.fn(),
  markLeadVerified: vi.fn(),
  markLeadNotificationSent: vi.fn(),
  grantReportAccess: vi.fn(),
  scheduleFollowUpSequence: vi.fn(),
  recalculateAndRouteLead: vi.fn(),
  sendEmail: vi.fn(),
  dczLeadEmail: vi.fn(),
  sha256: vi.fn(),
  requestIp: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/rate-limit/server-rate-limit', () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock('@/lib/analytics/funnel', () => ({
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
  recordSecurityEventSafe: mocks.recordSecurityEventSafe,
}));
vi.mock('@/lib/db/queries', () => ({
  confirmReportAccessToken: mocks.confirmReportAccessToken,
  findAuditById: mocks.findAuditById,
  markLeadVerified: mocks.markLeadVerified,
  markLeadNotificationSent: mocks.markLeadNotificationSent,
}));
vi.mock('@/lib/auth/report-access', () => ({ grantReportAccess: mocks.grantReportAccess }));
vi.mock('@/lib/db/revenue-queries', () => ({
  scheduleFollowUpSequence: mocks.scheduleFollowUpSequence,
}));
vi.mock('@/lib/leads/routing', () => ({
  recalculateAndRouteLead: mocks.recalculateAndRouteLead,
}));
vi.mock('@/lib/email/client', () => ({ sendEmail: mocks.sendEmail }));
vi.mock('@/lib/email/templates', () => ({ dczLeadEmail: mocks.dczLeadEmail }));
vi.mock('@/lib/security/crypto', () => ({ sha256: mocks.sha256 }));
vi.mock('@/lib/security/request-fingerprint', () => ({ requestIp: mocks.requestIp }));

import { POST } from '@/app/access/[token]/confirm/route';

const AUDIT_ID = '0f4d2cd0-62a8-4f21-9564-4b9f4e8c7771';
const LEAD_ID = '3b675b75-37f3-420d-a001-b1605d66b186';

describe('POST /access/[token]/confirm email semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    vi.stubEnv('DCZ_NOTIFICATION_EMAIL', 'internal-staging@example.test');
    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.enforceRateLimit.mockResolvedValue('subject-hash');
    mocks.recordFunnelEventSafe.mockResolvedValue(undefined);
    mocks.recordSecurityEventSafe.mockResolvedValue(undefined);
    mocks.confirmReportAccessToken.mockResolvedValue({
      auditId: AUDIT_ID,
      email: 'owner@example.test',
    });
    mocks.findAuditById.mockResolvedValue({
      id: AUDIT_ID,
      publicToken: 'audit_public-token',
      origin: 'https://example.test',
      targetUrl: 'https://example.test/',
      status: 'ready',
      expiresAt: new Date(Date.now() + 60_000),
    });
    const lead = {
      id: LEAD_ID,
      auditId: AUDIT_ID,
      email: 'owner@example.test',
      notificationSentAt: null,
    };
    mocks.markLeadVerified.mockResolvedValue(lead);
    mocks.grantReportAccess.mockResolvedValue(undefined);
    mocks.recalculateAndRouteLead.mockResolvedValue(lead);
    mocks.scheduleFollowUpSequence.mockResolvedValue(undefined);
    mocks.dczLeadEmail.mockReturnValue('<p>mock internal notification</p>');
    mocks.sendEmail.mockResolvedValue({ sent: true });
    mocks.markLeadNotificationSent.mockResolvedValue(undefined);
    mocks.sha256.mockReturnValue('access-token-hash');
    mocks.requestIp.mockReturnValue('192.0.2.10');
  });

  it('sends the mocked internal notification only after conscious confirmation', async () => {
    const request = new Request('https://dczweb.com/access/plain-token/confirm', {
      method: 'POST',
      headers: { origin: 'https://dczweb.com' },
    });
    const response = await POST(request, { params: Promise.resolve({ token: 'plain-token' }) });

    expect(response.status).toBe(303);
    expect(mocks.confirmReportAccessToken).toHaveBeenCalledWith('access-token-hash');
    expect(mocks.markLeadVerified).toHaveBeenCalledBefore(mocks.sendEmail);
    expect(mocks.grantReportAccess).toHaveBeenCalledBefore(mocks.sendEmail);
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'internal-staging@example.test',
      replyTo: 'owner@example.test',
      idempotencyKey: `verified-lead-${LEAD_ID}`,
    }));
    expect(mocks.markLeadNotificationSent).toHaveBeenCalledWith(LEAD_ID);
  });
});
