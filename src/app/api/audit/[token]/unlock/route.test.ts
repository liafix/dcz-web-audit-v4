import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicAppError } from '@/lib/errors/public-error';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  hasVerifiedFunnelSession: vi.fn(),
  findAuditByToken: vi.fn(),
  upsertLead: vi.fn(),
  claimLeadEmailDelivery: vi.fn(),
  createReportAccessToken: vi.fn(),
  markLeadEmailDelivery: vi.fn(),
  verifyTurnstile: vi.fn(),
  enforceRateLimit: vi.fn(),
  sendEmail: vi.fn(),
  auditResultEmail: vi.fn(),
  recordFunnelEventSafe: vi.fn(),
  recordSecurityEventSafe: vi.fn(),
  requestFingerprint: vi.fn(),
  requestIp: vi.fn(),
  randomToken: vi.fn(),
  sha256: vi.fn(),
  correlationId: vi.fn(),
  logApplicationEvent: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/auth/funnel-verification', () => ({
  hasVerifiedFunnelSession: mocks.hasVerifiedFunnelSession,
}));
vi.mock('@/lib/db/queries', () => ({
  findAuditByToken: mocks.findAuditByToken,
  upsertLead: mocks.upsertLead,
  claimLeadEmailDelivery: mocks.claimLeadEmailDelivery,
  createReportAccessToken: mocks.createReportAccessToken,
  markLeadEmailDelivery: mocks.markLeadEmailDelivery,
}));
vi.mock('@/lib/security/turnstile', () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock('@/lib/rate-limit/server-rate-limit', () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock('@/lib/email/client', () => ({ sendEmail: mocks.sendEmail }));
vi.mock('@/lib/email/templates', () => ({ auditResultEmail: mocks.auditResultEmail }));
vi.mock('@/lib/analytics/funnel', () => ({
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
  recordSecurityEventSafe: mocks.recordSecurityEventSafe,
}));
vi.mock('@/lib/security/request-fingerprint', () => ({
  requestFingerprint: mocks.requestFingerprint,
  requestIp: mocks.requestIp,
}));
vi.mock('@/lib/security/crypto', () => ({
  randomToken: mocks.randomToken,
  sha256: mocks.sha256,
}));
vi.mock('@/lib/monitoring/logger', () => ({
  correlationId: mocks.correlationId,
  logApplicationEvent: mocks.logApplicationEvent,
}));

import { POST } from '@/app/api/audit/[token]/unlock/route';

const PUBLIC_TOKEN = 'audit_public-token';
const AUDIT_ID = '0f4d2cd0-62a8-4f21-9564-4b9f4e8c7771';
const USER_EMAIL = 'owner@example.test';
const FRESH_TOKEN = 'fresh-turnstile-token';

const audit = {
  id: AUDIT_ID,
  publicToken: PUBLIC_TOKEN,
  status: 'ready',
  reportJson: { businessProfile: { vertical: 'unknown', businessModel: 'unknown' } },
  expiresAt: new Date(Date.now() + 60_000),
  origin: 'https://example.test',
  targetUrl: 'https://example.test/',
};

const lead = {
  id: '3b675b75-37f3-420d-a001-b1605d66b186',
  auditId: AUDIT_ID,
  email: USER_EMAIL,
  stage: 'pending_email_verification',
  emailVerifiedAt: null,
  emailLastSentAt: null,
  emailDeliveryStatus: 'pending',
};

const claimedLead = {
  ...lead,
  emailLastSentAt: new Date('2026-07-27T18:00:00.000Z'),
};

function request(input: {
  turnstileToken?: string | null;
  website?: string;
} = {}): Request {
  return new Request(`https://dczweb.com/api/audit/${PUBLIC_TOKEN}/unlock`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://dczweb.com',
      'x-forwarded-for': '192.0.2.10',
      'user-agent': 'test-browser',
    },
    body: JSON.stringify({
      email: USER_EMAIL,
      name: 'Owner',
      company: 'Example',
      marketingConsent: false,
      website: input.website ?? '',
      turnstileToken: input.turnstileToken ?? null,
    }),
  });
}

function context(token = PUBLIC_TOKEN) {
  return { params: Promise.resolve({ token }) };
}

describe('POST /api/audit/[token]/unlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.findAuditByToken.mockResolvedValue(audit);
    mocks.hasVerifiedFunnelSession.mockResolvedValue(true);
    mocks.verifyTurnstile.mockResolvedValue(true);
    mocks.enforceRateLimit
      .mockResolvedValueOnce('ip-hash')
      .mockResolvedValueOnce('email-hash');
    mocks.upsertLead.mockResolvedValue(lead);
    mocks.claimLeadEmailDelivery.mockResolvedValue(claimedLead);
    mocks.createReportAccessToken.mockResolvedValue(undefined);
    mocks.randomToken.mockReturnValue('plain-access-token');
    mocks.sha256.mockReturnValue('access-token-hash');
    mocks.auditResultEmail.mockReturnValue('<p>mock user report email</p>');
    mocks.sendEmail.mockResolvedValue({ sent: true });
    mocks.markLeadEmailDelivery.mockResolvedValue(undefined);
    mocks.requestFingerprint.mockReturnValue('fingerprint-hash');
    mocks.requestIp.mockReturnValue('192.0.2.10');
    mocks.recordFunnelEventSafe.mockResolvedValue(undefined);
    mocks.recordSecurityEventSafe.mockResolvedValue(undefined);
    mocks.correlationId.mockReturnValue('ERR-TEST0001');
    mocks.logApplicationEvent.mockResolvedValue(undefined);
  });

  it('uses a valid audit-bound session without calling Siteverify', async () => {
    const response = await POST(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.hasVerifiedFunnelSession).toHaveBeenCalledWith(AUDIT_ID);
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: USER_EMAIL,
      idempotencyKey: expect.stringContaining(String(claimedLead.emailLastSentAt.getTime())),
    }));
  });

  it('requires a visible fallback when the session is missing', async () => {
    mocks.hasVerifiedFunnelSession.mockResolvedValue(false);

    const response = await POST(request(), context());
    const payload = await response.json() as { code: string };

    expect(response.status).toBe(428);
    expect(payload.code).toBe('verification_required');
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('verifies a fresh fallback token exactly once', async () => {
    mocks.hasVerifiedFunnelSession.mockResolvedValue(false);

    const response = await POST(request({ turnstileToken: FRESH_TOKEN }), context());

    expect(response.status).toBe(200);
    expect(mocks.verifyTurnstile).toHaveBeenCalledTimes(1);
    expect(mocks.verifyTurnstile).toHaveBeenCalledWith(expect.any(Request), FRESH_TOKEN);
  });

  it('rejects honeypot input before session or email work', async () => {
    const response = await POST(request({ website: 'bot.example' }), context());

    expect(response.status).toBe(422);
    expect(mocks.hasVerifiedFunnelSession).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('keeps origin validation and opaque audit-token authorization mandatory', async () => {
    mocks.assertSameOrigin.mockImplementationOnce(() => {
      throw new PublicAppError({ code: 'invalid_origin', status: 403, publicMessage: 'Rejected.' });
    });
    const originResponse = await POST(request(), context());
    expect(originResponse.status).toBe(403);
    expect(mocks.findAuditByToken).not.toHaveBeenCalled();

    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.findAuditByToken.mockResolvedValueOnce(null);
    const tokenResponse = await POST(request(), context('invalid-audit-token'));
    expect(tokenResponse.status).toBe(404);
    expect(mocks.hasVerifiedFunnelSession).not.toHaveBeenCalled();
  });

  it('allows exactly one concurrent delivery claimant and email attempt', async () => {
    let claimed = false;
    mocks.claimLeadEmailDelivery.mockImplementation(async () => {
      if (claimed) return null;
      claimed = true;
      return claimedLead;
    });

    const [first, second] = await Promise.all([
      POST(request(), context()),
      POST(request(), context()),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.claimLeadEmailDelivery).toHaveBeenCalledTimes(2);
    expect(mocks.createReportAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('does not replace a valid access token or regress a verified duplicate', async () => {
    mocks.upsertLead.mockResolvedValue({
      ...lead,
      stage: 'verified',
      emailVerifiedAt: new Date(),
      emailDeliveryStatus: 'verified',
    });
    mocks.claimLeadEmailDelivery.mockResolvedValue(null);

    const response = await POST(request(), context());

    expect(response.status).toBe(200);
    expect(mocks.createReportAccessToken).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
