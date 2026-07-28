import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  verifyTurnstile: vi.fn(),
  enforceRateLimit: vi.fn(),
  recordSecurityEventSafe: vi.fn(),
  recordFunnelEventSafe: vi.fn(),
  findAuditByToken: vi.fn(),
  findLeadForAuditEmail: vi.fn(),
  claimLeadResendDelivery: vi.fn(),
  createReportAccessToken: vi.fn(),
  markLeadEmailDelivery: vi.fn(),
  sendEmail: vi.fn(),
  auditResultEmail: vi.fn(),
  requestIp: vi.fn(),
  randomToken: vi.fn(),
  sha256: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/security/turnstile', () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock('@/lib/rate-limit/server-rate-limit', () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock('@/lib/analytics/funnel', () => ({
  recordSecurityEventSafe: mocks.recordSecurityEventSafe,
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
}));
vi.mock('@/lib/db/queries', () => ({
  findAuditByToken: mocks.findAuditByToken,
  findLeadForAuditEmail: mocks.findLeadForAuditEmail,
  claimLeadResendDelivery: mocks.claimLeadResendDelivery,
  createReportAccessToken: mocks.createReportAccessToken,
  markLeadEmailDelivery: mocks.markLeadEmailDelivery,
}));
vi.mock('@/lib/email/client', () => ({ sendEmail: mocks.sendEmail }));
vi.mock('@/lib/email/templates', () => ({ auditResultEmail: mocks.auditResultEmail }));
vi.mock('@/lib/security/request-fingerprint', () => ({ requestIp: mocks.requestIp }));
vi.mock('@/lib/security/crypto', () => ({
  randomToken: mocks.randomToken,
  sha256: mocks.sha256,
}));

import { POST } from '@/app/api/audit/[token]/resend/route';

const AUDIT_ID = '0f4d2cd0-62a8-4f21-9564-4b9f4e8c7771';
const LEAD_ID = '3b675b75-37f3-420d-a001-b1605d66b186';
const CLAIMED_AT = new Date('2026-07-28T12:00:00.000Z');

function request() {
  return new Request('https://dczweb.com/api/audit/audit_token/resend', {
    method: 'POST',
    headers: {
      origin: 'https://dczweb.com',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: 'owner@example.test',
      turnstileToken: 'fresh-client-token',
    }),
  });
}

describe('POST /api/audit/[token]/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    mocks.verifyTurnstile.mockResolvedValue(true);
    mocks.enforceRateLimit.mockResolvedValue('subject-hash');
    mocks.recordSecurityEventSafe.mockResolvedValue(undefined);
    mocks.recordFunnelEventSafe.mockResolvedValue(undefined);
    mocks.findAuditByToken.mockResolvedValue({
      id: AUDIT_ID,
      status: 'ready',
      origin: 'https://example.test',
    });
    const lead = {
      id: LEAD_ID,
      auditId: AUDIT_ID,
      email: 'owner@example.test',
      emailLastSentAt: CLAIMED_AT,
    };
    mocks.findLeadForAuditEmail.mockResolvedValue(lead);
    mocks.claimLeadResendDelivery.mockResolvedValue(lead);
    mocks.randomToken.mockReturnValue('plain-access-token');
    mocks.sha256.mockReturnValue('hashed-access-token');
    mocks.auditResultEmail.mockReturnValue('<p>result</p>');
    mocks.sendEmail.mockResolvedValue({ sent: true });
  });

  it('binds Siteverify and sends only after the atomic resend claim', async () => {
    const response = await POST(request(), {
      params: Promise.resolve({ token: 'audit_token' }),
    });

    expect(response.status).toBe(200);
    expect(mocks.verifyTurnstile).toHaveBeenCalledWith(
      expect.any(Request),
      'fresh-client-token',
      { expectedHostname: 'dczweb.com', expectedAction: 'audit_resend' },
    );
    expect(mocks.claimLeadResendDelivery).toHaveBeenCalledWith(LEAD_ID);
    expect(mocks.claimLeadResendDelivery).toHaveBeenCalledBefore(mocks.createReportAccessToken);
    expect(mocks.createReportAccessToken).toHaveBeenCalledBefore(mocks.sendEmail);
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'owner@example.test',
      idempotencyKey: `audit-resend-${AUDIT_ID}-${LEAD_ID}-${CLAIMED_AT.toISOString()}`,
    }));
    expect(mocks.markLeadEmailDelivery).toHaveBeenCalledWith(LEAD_ID, {
      sent: true,
      reason: undefined,
    });
  });

  it('does not mint a token or send when another request owns the resend claim', async () => {
    mocks.claimLeadResendDelivery.mockResolvedValueOnce(null);

    const response = await POST(request(), {
      params: Promise.resolve({ token: 'audit_token' }),
    });

    expect(response.status).toBe(429);
    expect(mocks.createReportAccessToken).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
