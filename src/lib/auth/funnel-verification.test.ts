import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signPayload } from '@/lib/security/crypto';

const mocks = vi.hoisted(() => {
  const state: {
    value: string | null;
    setInput: { name: string; value: string; options: Record<string, unknown> } | null;
  } = { value: null, setInput: null };
  const store = {
    get: vi.fn(() => (state.value ? { value: state.value } : undefined)),
    set: vi.fn((name: string, value: string, options: Record<string, unknown>) => {
      state.value = value;
      state.setInput = { name, value, options };
    }),
  };
  return { state, store };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mocks.store),
}));

import {
  FUNNEL_SESSION_COOKIE,
  FUNNEL_SESSION_SECONDS,
  hasVerifiedFunnelSession,
  issueVerifiedFunnelSession,
} from '@/lib/auth/funnel-verification';

const AUDIT_A = '0f4d2cd0-62a8-4f21-9564-4b9f4e8c7771';
const AUDIT_B = 'ce1f7830-2022-4e8e-8c0e-44cd43fecc7c';
const SECRET = 'funnel-session-test-secret-with-ample-entropy-0001';
const NOW_SECONDS = 1_800_000_000;

function claimsToken(input: Partial<{
  purpose: string;
  version: number;
  auditId: string;
  iat: number;
  exp: number;
}> = {}): string {
  return signPayload({
    purpose: 'verified_audit_funnel',
    version: 1,
    auditId: AUDIT_A,
    iat: NOW_SECONDS,
    exp: NOW_SECONDS + FUNNEL_SESSION_SECONDS,
    ...input,
  }, SECRET);
}

describe('verified funnel session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_SECONDS * 1000);
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NEXT_PUBLIC_PREVENT_INDEXING', 'true');
    vi.stubEnv('FUNNEL_SESSION_SECRET', SECRET);
    mocks.state.value = null;
    mocks.state.setInput = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('issues a minimal 25-minute HttpOnly audit-bound cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await issueVerifiedFunnelSession(AUDIT_A);

    const setInput = mocks.state.setInput;
    expect(setInput?.name).toBe(FUNNEL_SESSION_COOKIE);
    expect(setInput?.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: FUNNEL_SESSION_SECONDS,
      expires: new Date((NOW_SECONDS + FUNNEL_SESSION_SECONDS) * 1000),
    });
    expect(setInput?.options).not.toHaveProperty('domain');

    const encoded = setInput!.value.split('.')[0]!;
    const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Record<string, unknown>;
    expect(claims).toEqual({
      purpose: 'verified_audit_funnel',
      version: 1,
      auditId: AUDIT_A,
      iat: NOW_SECONDS,
      exp: NOW_SECONDS + FUNNEL_SESSION_SECONDS,
    });
    for (const forbidden of [
      'email',
      'name',
      'company',
      'publicToken',
      'turnstileToken',
      'report',
      'ip',
      'userAgent',
      'authorization',
      SECRET,
    ]) {
      expect(JSON.stringify(claims)).not.toContain(forbidden);
    }
  });

  it('accepts only the audit to which the valid session is bound', async () => {
    mocks.state.value = claimsToken();
    await expect(hasVerifiedFunnelSession(AUDIT_A)).resolves.toBe(true);
    await expect(hasVerifiedFunnelSession(AUDIT_B)).resolves.toBe(false);
  });

  it.each([
    ['expired', claimsToken({ exp: NOW_SECONDS })],
    ['malformed', 'not-a-signed-cookie'],
    ['extra signature segment', `${claimsToken()}.extra`],
    ['altered signature', `${claimsToken().split('.')[0]}.invalid-signature`],
    ['oversized lifetime', claimsToken({ exp: NOW_SECONDS + FUNNEL_SESSION_SECONDS + 1 })],
    ['invalid purpose', claimsToken({ purpose: 'admin' })],
    ['invalid version', claimsToken({ version: 2 })],
    ['future issued-at', claimsToken({ iat: NOW_SECONDS + 31, exp: NOW_SECONDS + 40 })],
    ['invalid audit ID', claimsToken({ auditId: 'not-a-uuid' })],
    ['unexpected claim', signPayload({
      purpose: 'verified_audit_funnel',
      version: 1,
      auditId: AUDIT_A,
      iat: NOW_SECONDS,
      exp: NOW_SECONDS + FUNNEL_SESSION_SECONDS,
      role: 'admin',
    }, SECRET)],
  ])('rejects a %s session', async (_label, token) => {
    mocks.state.value = token;
    await expect(hasVerifiedFunnelSession(AUDIT_A)).resolves.toBe(false);
  });

  it('fails closed when the independent secret is missing or too short', async () => {
    vi.stubEnv('FUNNEL_SESSION_SECRET', '');
    await expect(issueVerifiedFunnelSession(AUDIT_A)).rejects.toThrow('FUNNEL_SESSION_SECRET');
    vi.stubEnv('FUNNEL_SESSION_SECRET', 'too-short');
    await expect(issueVerifiedFunnelSession(AUDIT_A)).rejects.toThrow('at least 32 bytes');
  });

  it('fails closed during live-production validation when the secret is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_PREVENT_INDEXING', 'false');
    vi.stubEnv('FUNNEL_SESSION_SECRET', '');
    mocks.state.value = claimsToken();

    await expect(hasVerifiedFunnelSession(AUDIT_A)).rejects.toThrow('FUNNEL_SESSION_SECRET');
  });
});
