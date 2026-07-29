import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { PublicAppError } from '@/lib/errors/public-error';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  findOpportunityBriefByHash: vi.fn(),
  enforceRateLimit: vi.fn(),
  requestIp: vi.fn(),
  randomToken: vi.fn(),
  sha256: vi.fn(),
  createBookingIntent: vi.fn(),
  recordFunnelEventSafe: vi.fn(),
  recordSecurityEventSafe: vi.fn(),
  recalculateAndRouteLead: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/rate-limit/server-rate-limit', () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock('@/lib/security/request-fingerprint', () => ({ requestIp: mocks.requestIp }));
vi.mock('@/lib/security/crypto', () => ({
  randomToken: mocks.randomToken,
  sha256: mocks.sha256,
}));
vi.mock('@/lib/db/revenue-queries', () => ({
  createBookingIntent: mocks.createBookingIntent,
  findOpportunityBriefByHash: mocks.findOpportunityBriefByHash,
}));
vi.mock('@/lib/analytics/funnel', () => ({
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
  recordSecurityEventSafe: mocks.recordSecurityEventSafe,
}));
vi.mock('@/lib/leads/routing', () => ({
  recalculateAndRouteLead: mocks.recalculateAndRouteLead,
}));

import { POST } from '@/app/brief/[token]/book/confirm/route';

describe('POST /brief/[token]/book/confirm canonical redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    vi.stubEnv('DIAGNOSTIC_BOOKING_URL', 'https://booking.example/brief');
    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.sha256.mockReturnValue('brief-token-hash');
    mocks.findOpportunityBriefByHash.mockResolvedValue({
      id: 'brief-id',
      auditId: 'audit-id',
      leadId: 'lead-id',
    });
    mocks.enforceRateLimit.mockResolvedValue('subject-hash');
    mocks.requestIp.mockReturnValue('192.0.2.10');
    mocks.randomToken.mockReturnValue('public-reference');
    mocks.createBookingIntent.mockResolvedValue(undefined);
    mocks.recordFunnelEventSafe.mockResolvedValue(undefined);
    mocks.recordSecurityEventSafe.mockResolvedValue(undefined);
    mocks.recalculateAndRouteLead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('preserves the external provider after recording the booking intent', async () => {
    const redirectSpy = vi.spyOn(NextResponse, 'redirect');
    const response = await POST(
      new Request('http://0.0.0.0:3000/brief/plain-token/book/confirm', {
        method: 'POST',
        headers: { origin: 'https://dczweb.com' },
      }),
      { params: Promise.resolve({ token: 'plain-token' }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://booking.example/brief?utm_source=dczwebaudit&utm_medium=opportunity_brief&audit_reference=public-reference',
    );
    expect(mocks.createBookingIntent).toHaveBeenCalledBefore(redirectSpy);
    expect(mocks.recalculateAndRouteLead).toHaveBeenCalledBefore(redirectSpy);
  });

  it('uses the canonical origin for local Opportunity Brief fallbacks', async () => {
    mocks.findOpportunityBriefByHash.mockRejectedValueOnce(new PublicAppError({
      code: 'brief_unavailable',
      status: 410,
      publicMessage: 'Brief is unavailable.',
    }));

    const response = await POST(
      new Request('http://0.0.0.0:3000/brief/plain-token/book/confirm', {
        method: 'POST',
        headers: { origin: 'https://dczweb.com' },
      }),
      { params: Promise.resolve({ token: 'plain-token' }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://dczweb.com/contact?booking=unavailable&reason=brief_unavailable',
    );
    expect(response.headers.get('location')).not.toMatch(
      /0\.0\.0\.0|localhost|127\.0\.0\.1|hostingersite\.com/i,
    );
    expect(mocks.createBookingIntent).not.toHaveBeenCalled();
  });
});
