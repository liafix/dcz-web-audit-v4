import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  verifyUnsubscribeToken: vi.fn(),
  markMarketingUnsubscribed: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/follow-up/unsubscribe', () => ({
  verifyUnsubscribeToken: mocks.verifyUnsubscribeToken,
}));
vi.mock('@/lib/db/revenue-queries', () => ({
  markMarketingUnsubscribed: mocks.markMarketingUnsubscribed,
}));

import { POST } from '@/app/unsubscribe/[token]/confirm/route';

describe('POST /unsubscribe/[token]/confirm canonical redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.verifyUnsubscribeToken.mockReturnValue({ leadId: 'lead-id' });
    mocks.markMarketingUnsubscribed.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function request() {
    return new Request('http://0.0.0.0:3000/unsubscribe/plain-token/confirm', {
      method: 'POST',
      headers: { origin: 'https://dczweb.com' },
    });
  }

  it('mutates before returning the canonical success redirect', async () => {
    const redirectSpy = vi.spyOn(NextResponse, 'redirect');
    const response = await POST(request(), {
      params: Promise.resolve({ token: 'plain-token' }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://dczweb.com/?unsubscribe=done');
    expect(mocks.markMarketingUnsubscribed).toHaveBeenCalledWith('lead-id');
    expect(mocks.markMarketingUnsubscribed).toHaveBeenCalledBefore(redirectSpy);
  });

  it('returns the canonical invalid redirect without mutating', async () => {
    mocks.verifyUnsubscribeToken.mockReturnValueOnce(null);
    const response = await POST(request(), {
      params: Promise.resolve({ token: 'plain-token' }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://dczweb.com/?unsubscribe=invalid');
    expect(mocks.markMarketingUnsubscribed).not.toHaveBeenCalled();
  });

  it('returns the canonical failure redirect after an exception', async () => {
    mocks.markMarketingUnsubscribed.mockRejectedValueOnce(new Error('database failure'));
    const response = await POST(request(), {
      params: Promise.resolve({ token: 'plain-token' }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://dczweb.com/?unsubscribe=failed');
    expect(response.headers.get('location')).not.toMatch(
      /0\.0\.0\.0|localhost|127\.0\.0\.1|hostingersite\.com/i,
    );
  });
});
