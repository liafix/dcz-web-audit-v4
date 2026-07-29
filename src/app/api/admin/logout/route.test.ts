import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  clearAdminSession: vi.fn(),
}));

vi.mock('@/lib/security/request-origin', () => ({ assertSameOrigin: mocks.assertSameOrigin }));
vi.mock('@/lib/auth/admin-session', () => ({ clearAdminSession: mocks.clearAdminSession }));

import { POST } from '@/app/api/admin/logout/route';

describe('POST /api/admin/logout canonical redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://dczweb.com');
    mocks.assertSameOrigin.mockImplementation(() => undefined);
    mocks.clearAdminSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('clears the session before redirecting to the canonical login page', async () => {
    const redirectSpy = vi.spyOn(NextResponse, 'redirect');
    const response = await POST(
      new Request('http://0.0.0.0:3000/api/admin/logout', {
        method: 'POST',
        headers: { origin: 'https://dczweb.com' },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://dczweb.com/admin/login');
    expect(response.headers.get('location')).not.toMatch(
      /0\.0\.0\.0|localhost|127\.0\.0\.1|hostingersite\.com/i,
    );
    expect(mocks.clearAdminSession).toHaveBeenCalledTimes(1);
    expect(mocks.clearAdminSession).toHaveBeenCalledBefore(redirectSpy);
  });
});
