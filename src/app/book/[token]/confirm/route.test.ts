import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { PublicAppError } from '@/lib/errors/public-error';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  requireRevenueAudit: vi.fn(),
  enforceRateLimit: vi.fn(),
  requestIp: vi.fn(),
  randomToken: vi.fn(),
  createBookingIntent: vi.fn(),
  recordFunnelEventSafe: vi.fn(),
  recordSecurityEventSafe: vi.fn(),
  recalculateAndRouteLead: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/revenue/access', () => ({ requireRevenueAudit: mocks.requireRevenueAudit }));
vi.mock('@/lib/rate-limit/server-rate-limit', () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock('@/lib/security/request-fingerprint', () => ({ requestIp: mocks.requestIp }));
vi.mock('@/lib/security/crypto', () => ({ randomToken: mocks.randomToken }));
vi.mock('@/lib/db/revenue-queries', () => ({ createBookingIntent: mocks.createBookingIntent }));
vi.mock('@/lib/analytics/funnel', () => ({
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
  recordSecurityEventSafe: mocks.recordSecurityEventSafe,
}));
vi.mock('@/lib/leads/routing', () => ({
  recalculateAndRouteLead: mocks.recalculateAndRouteLead,
}));

import { POST } from '@/app/book/[token]/confirm/route';

describe('POST /book/[token]/confirm canonical redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    vi.stubEnv('DIAGNOSTIC_BOOKING_URL', 'https://booking.example/schedule?existing=1');
    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.requireRevenueAudit.mockResolvedValue({
      audit: { id: 'audit-id' },
      lead: { id: 'lead-id' },
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

  it('preserves the external booking provider and completes mutations before redirecting', async () => {
    const redirectSpy = vi.spyOn(NextResponse, 'redirect');
    const response = await POST(
      new Request('http://0.0.0.0:3000/book/audit-token/confirm', {
        method: 'POST',
        headers: { origin: 'https://dczweb.com' },
      }),
      { params: Promise.resolve({ token: 'audit-token' }) },
    );

    const location = response.headers.get('location');
    expect(response.status).toBe(303);
    expect(location).toBe(
      'https://booking.example/schedule?existing=1&utm_source=dczwebaudit&utm_medium=revenue_diagnostic&audit_reference=public-reference',
    );
    expect(new URL(location!).origin).toBe('https://booking.example');
    expect(mocks.createBookingIntent).toHaveBeenCalledWith({
      auditId: 'audit-id',
      leadId: 'lead-id',
      provider: 'booking.example',
      publicReference: 'public-reference',
    });
    expect(mocks.createBookingIntent).toHaveBeenCalledBefore(redirectSpy);
    expect(mocks.recalculateAndRouteLead).toHaveBeenCalledBefore(redirectSpy);
  });

  it('uses the canonical application origin only for local fallback redirects', async () => {
    mocks.requireRevenueAudit.mockRejectedValueOnce(new PublicAppError({
      code: 'booking_unavailable',
      status: 503,
      publicMessage: 'Booking is unavailable.',
    }));

    const response = await POST(
      new Request('http://0.0.0.0:3000/book/audit-token/confirm', {
        method: 'POST',
        headers: { origin: 'https://dczweb.com' },
      }),
      { params: Promise.resolve({ token: 'audit-token' }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://dczweb.com/contact?booking=unavailable&reason=booking_unavailable',
    );
    expect(response.headers.get('location')).not.toMatch(
      /0\.0\.0\.0|localhost|127\.0\.0\.1|hostingersite\.com/i,
    );
    expect(mocks.createBookingIntent).not.toHaveBeenCalled();
  });
});
