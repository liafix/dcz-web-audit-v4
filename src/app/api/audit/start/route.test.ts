import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicAppError } from '@/lib/errors/public-error';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  verifyTurnstileDetailed: vi.fn(),
  issueVerifiedFunnelSession: vi.fn(),
  normalizeUrl: vi.fn(),
  requestFingerprint: vi.fn(),
  enforceRateLimit: vi.fn(),
  countRecentAuditsByFingerprint: vi.fn(),
  createAudit: vi.fn(),
  recordFunnelEventSafe: vi.fn(),
  recordSecurityEventSafe: vi.fn(),
  randomToken: vi.fn(),
  sha256: vi.fn(),
  correlationId: vi.fn(),
  logApplicationEvent: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({
  assertSameOrigin: mocks.assertSameOrigin,
}));

vi.mock('@/lib/security/turnstile', () => ({
  verifyTurnstileDetailed: mocks.verifyTurnstileDetailed,
}));

vi.mock('@/lib/auth/funnel-verification', () => ({
  issueVerifiedFunnelSession: mocks.issueVerifiedFunnelSession,
}));

vi.mock('@/lib/security/normalize-url', () => ({
  normalizeUrl: mocks.normalizeUrl,
}));

vi.mock('@/lib/security/request-fingerprint', () => ({
  requestFingerprint: mocks.requestFingerprint,
}));

vi.mock('@/lib/rate-limit/server-rate-limit', () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));

vi.mock('@/lib/db/queries', () => ({
  countRecentAuditsByFingerprint: mocks.countRecentAuditsByFingerprint,
  createAudit: mocks.createAudit,
}));

vi.mock('@/lib/analytics/funnel', () => ({
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
  recordSecurityEventSafe: mocks.recordSecurityEventSafe,
}));

vi.mock('@/lib/security/crypto', () => ({
  randomToken: mocks.randomToken,
  sha256: mocks.sha256,
}));

vi.mock('@/lib/monitoring/logger', () => ({
  correlationId: mocks.correlationId,
  logApplicationEvent: mocks.logApplicationEvent,
}));

import { POST } from '@/app/api/audit/start/route';

const INTERNAL_ERROR_ID = 'ERR-0839F96E';
const TEST_TOKEN = 'mock-route-token-never-log';
const TEST_SECRET = 'mock-route-secret-never-log';
const AUDITED_URL = 'https://sensitive-target.example/private?campaign=private';
const USER_EMAIL = 'private-user@example.test';
const COOKIE = 'session=private-cookie';
const AUTHORIZATION = 'Bearer private-authorization';
const IP_ADDRESS = '192.0.2.44';

function auditRequest(body: Record<string, unknown>): Request {
  return new Request('https://dczweb.com/api/audit/start?private=query', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://dczweb.com',
      referer: 'https://dczweb.com/audit/start?private=referer',
      cookie: COOKIE,
      authorization: AUTHORIZATION,
      'x-forwarded-for': IP_ADDRESS,
      'user-agent': 'private-user-agent',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/audit/start Turnstile diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://DCZWEB.com/';

    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.correlationId.mockReturnValue(INTERNAL_ERROR_ID);
    mocks.logApplicationEvent.mockResolvedValue(undefined);
    mocks.recordFunnelEventSafe.mockResolvedValue(undefined);
    mocks.recordSecurityEventSafe.mockResolvedValue(undefined);
    mocks.issueVerifiedFunnelSession.mockResolvedValue(undefined);
  });

  it('preserves the public 422 response and logs only allowlisted diagnostics with the same error ID', async () => {
    mocks.verifyTurnstileDetailed.mockResolvedValue({
      siteverifyHttpStatus: 200,
      success: false,
      errorCodes: ['timeout-or-duplicate'],
      returnedHostname: 'dczweb.com',
      returnedAction: null,
      failureClassification: 'siteverify_rejected',
    });

    const response = await POST(
      auditRequest({
        url: AUDITED_URL,
        website: '',
        turnstileToken: TEST_TOKEN,
        email: USER_EMAIL,
      }),
    );
    const payload = (await response.json()) as {
      error: string;
      code: string;
      errorId: string;
    };

    expect(response.status).toBe(422);
    expect(payload).toEqual({
      error: 'Bezpečnostné overenie zlyhalo. Obnovte stránku a skúste to znova.',
      code: 'turnstile_failed',
      errorId: INTERNAL_ERROR_ID,
    });
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.normalizeUrl).toHaveBeenCalledWith(AUDITED_URL);
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.issueVerifiedFunnelSession).not.toHaveBeenCalled();

    expect(mocks.logApplicationEvent).toHaveBeenCalledTimes(1);
    const logInput = mocks.logApplicationEvent.mock.calls[0]?.[0] as {
      event: string;
      errorId: string;
      context: {
        route: string;
        details: Record<string, unknown>;
      };
    };
    expect(logInput.event).toBe('turnstile_failed');
    expect(logInput.errorId).toBe(payload.errorId);
    expect(logInput.context).toEqual({
      route: 'audit_start',
      details: {
        siteverifyHttpStatus: 200,
        siteverifySuccess: false,
        siteverifyErrorCodes: ['timeout-or-duplicate'],
        expectedHostname: 'dczweb.com',
        returnedHostname: 'dczweb.com',
        expectedAction: null,
        returnedAction: null,
        failureClassification: 'siteverify_rejected',
      },
    });
    expect(Object.keys(logInput.context.details).sort()).toEqual([
      'expectedAction',
      'expectedHostname',
      'failureClassification',
      'returnedAction',
      'returnedHostname',
      'siteverifyErrorCodes',
      'siteverifyHttpStatus',
      'siteverifySuccess',
    ]);

    const safeLogEnvelope = JSON.stringify(logInput);
    for (const forbidden of [
      TEST_TOKEN,
      TEST_SECRET,
      AUDITED_URL,
      USER_EMAIL,
      COOKIE,
      AUTHORIZATION,
      IP_ADDRESS,
      'private-user-agent',
      'private=query',
      'private=referer',
    ]) {
      expect(safeLogEnvelope).not.toContain(forbidden);
    }
  });

  it('does not emit Turnstile diagnostics when verification succeeds', async () => {
    mocks.verifyTurnstileDetailed.mockResolvedValue({
      siteverifyHttpStatus: 200,
      success: true,
      errorCodes: [],
      returnedHostname: 'dczweb.com',
      returnedAction: null,
      failureClassification: null,
    });
    mocks.normalizeUrl.mockReturnValue({
      url: 'https://example.test/',
      origin: 'https://example.test',
    });
    mocks.requestFingerprint.mockReturnValue('fingerprint-hash');
    mocks.enforceRateLimit
      .mockResolvedValueOnce('hour-subject-hash')
      .mockResolvedValueOnce('day-subject-hash');
    mocks.countRecentAuditsByFingerprint.mockResolvedValue(0);
    mocks.randomToken.mockReturnValue('public-token-suffix');
    mocks.sha256.mockReturnValue('deduplication-hash');
    mocks.createAudit.mockResolvedValue({
      id: 'audit-id',
      publicToken: 'audit_public-token-suffix',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      referrerHost: null,
    });

    const response = await POST(
      auditRequest({
        url: 'https://example.test',
        website: '',
        turnstileToken: TEST_TOKEN,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      token: 'audit_public-token-suffix',
    });
    expect(mocks.createAudit).toHaveBeenCalledTimes(1);
    expect(mocks.issueVerifiedFunnelSession).toHaveBeenCalledWith('audit-id');
    expect(mocks.assertSameOrigin.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.normalizeUrl.mock.invocationCallOrder[0]!,
    );
    expect(mocks.normalizeUrl.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.verifyTurnstileDetailed.mock.invocationCallOrder[0]!,
    );
    expect(mocks.verifyTurnstileDetailed.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.enforceRateLimit.mock.invocationCallOrder[0]!,
    );
    expect(mocks.enforceRateLimit.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.createAudit.mock.invocationCallOrder[0]!,
    );
    expect(mocks.createAudit.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.issueVerifiedFunnelSession.mock.invocationCallOrder[0]!,
    );
    expect(mocks.logApplicationEvent).not.toHaveBeenCalled();
  });

  it('rejects an unsafe normalized URL before Siteverify and session issuance', async () => {
    mocks.normalizeUrl.mockImplementation(() => {
      throw new Error('unsafe URL');
    });

    const response = await POST(auditRequest({
      url: 'http://127.0.0.1',
      website: '',
      turnstileToken: TEST_TOKEN,
    }));

    expect(response.status).toBe(422);
    expect(mocks.verifyTurnstileDetailed).not.toHaveBeenCalled();
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.issueVerifiedFunnelSession).not.toHaveBeenCalled();
  });

  it('does not issue a session when the request is rate limited after Siteverify', async () => {
    mocks.verifyTurnstileDetailed.mockResolvedValue({
      siteverifyHttpStatus: 200,
      success: true,
      errorCodes: [],
      returnedHostname: 'dczweb.com',
      returnedAction: null,
      failureClassification: null,
    });
    mocks.normalizeUrl.mockReturnValue({ url: 'https://example.test/', origin: 'https://example.test' });
    mocks.requestFingerprint.mockReturnValue('fingerprint-hash');
    mocks.enforceRateLimit.mockRejectedValueOnce(new PublicAppError({
      code: 'rate_limited',
      status: 429,
      publicMessage: 'Dosiahli ste bezpečnostný limit.',
    }));

    const response = await POST(auditRequest({
      url: 'https://example.test',
      website: '',
      turnstileToken: TEST_TOKEN,
    }));

    expect(response.status).toBe(429);
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.issueVerifiedFunnelSession).not.toHaveBeenCalled();
  });

  it('does not issue a session when audit creation fails', async () => {
    mocks.verifyTurnstileDetailed.mockResolvedValue({
      siteverifyHttpStatus: 200,
      success: true,
      errorCodes: [],
      returnedHostname: 'dczweb.com',
      returnedAction: null,
      failureClassification: null,
    });
    mocks.normalizeUrl.mockReturnValue({ url: 'https://example.test/', origin: 'https://example.test' });
    mocks.requestFingerprint.mockReturnValue('fingerprint-hash');
    mocks.enforceRateLimit
      .mockResolvedValueOnce('hour-subject-hash')
      .mockResolvedValueOnce('day-subject-hash');
    mocks.countRecentAuditsByFingerprint.mockResolvedValue(0);
    mocks.randomToken.mockReturnValue('public-token-suffix');
    mocks.sha256.mockReturnValue('deduplication-hash');
    mocks.createAudit.mockRejectedValue(new Error('database unavailable'));

    const response = await POST(auditRequest({
      url: 'https://example.test',
      website: '',
      turnstileToken: TEST_TOKEN,
    }));

    expect(response.status).toBe(500);
    expect(mocks.issueVerifiedFunnelSession).not.toHaveBeenCalled();
  });
});
