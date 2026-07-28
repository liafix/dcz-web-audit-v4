import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  verifyTurnstile,
  verifyTurnstileDetailed,
  type TurnstileVerificationResult,
} from '@/lib/security/turnstile';

const TEST_SECRET = 'mock-secret-for-siteverify-tests-only';
const TEST_TOKEN = 'mock-response-token-for-tests-only';

function request(): Request {
  return new Request('https://dczweb.com/api/audit/start', {
    method: 'POST',
    headers: { 'x-forwarded-for': '192.0.2.10' },
  });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Turnstile Siteverify diagnostics', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NEXT_PUBLIC_PREVENT_INDEXING', 'true');
    vi.stubEnv('TURNSTILE_ENABLED', 'true');
    vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET);
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'mock-site-key-for-tests-only');
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('retains only sanitized fields for an HTTP 200 success response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        hostname: 'DCZWEB.COM',
        action: 'audit_start',
        challenge_ts: 'not-retained',
        cdata: 'not-retained',
      }),
    );

    const verification = await verifyTurnstileDetailed(request(), TEST_TOKEN);

    expect(verification).toEqual<TurnstileVerificationResult>({
      siteverifyHttpStatus: 200,
      success: true,
      errorCodes: [],
      returnedHostname: 'dczweb.com',
      returnedAction: 'audit_start',
      failureClassification: null,
    });
    expect(Object.keys(verification).sort()).toEqual([
      'errorCodes',
      'failureClassification',
      'returnedAction',
      'returnedHostname',
      'siteverifyHttpStatus',
      'success',
    ]);
    expect(JSON.stringify(verification)).not.toContain(TEST_TOKEN);
    expect(JSON.stringify(verification)).not.toContain(TEST_SECRET);
  });

  it.each([
    [
      { expectedHostname: 'dczweb.com', expectedAction: 'audit_start' },
      { hostname: 'attacker.example', action: 'audit_start' },
      'siteverify_hostname_mismatch',
    ],
    [
      { expectedHostname: 'dczweb.com', expectedAction: 'audit_unlock' },
      { hostname: 'dczweb.com', action: 'audit_start' },
      'siteverify_action_mismatch',
    ],
  ] as const)('fails closed when hostname or action binding differs', async (
    expected,
    returned,
    failureClassification,
  ) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, ...returned }));

    await expect(verifyTurnstileDetailed(request(), TEST_TOKEN, expected)).resolves.toEqual({
      siteverifyHttpStatus: 200,
      success: false,
      errorCodes: [],
      returnedHostname: returned.hostname,
      returnedAction: returned.action,
      failureClassification,
    });
  });

  it('retries one transient Siteverify failure with one idempotency key', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('temporary', { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        hostname: 'dczweb.com',
        action: 'audit_resend',
      }));

    await expect(verifyTurnstileDetailed(request(), TEST_TOKEN, {
      expectedHostname: 'dczweb.com',
      expectedAction: 'audit_resend',
    })).resolves.toMatchObject({ success: true, failureClassification: null });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    const secondBody = fetchMock.mock.calls[1]?.[1]?.body as URLSearchParams;
    expect(firstBody.get('idempotency_key')).toMatch(/^[0-9a-f-]{36}$/);
    expect(secondBody.get('idempotency_key')).toBe(firstBody.get('idempotency_key'));
    expect(firstBody.get('response')).toBe(TEST_TOKEN);
  });

  it.each(['timeout-or-duplicate', 'invalid-input-response'])(
    'retains the sanitized %s rejection code',
    async (errorCode) => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          success: false,
          'error-codes': [errorCode],
          hostname: 'dczweb.com',
        }),
      );

      await expect(verifyTurnstileDetailed(request(), TEST_TOKEN)).resolves.toEqual({
        siteverifyHttpStatus: 200,
        success: false,
        errorCodes: [errorCode],
        returnedHostname: 'dczweb.com',
        returnedAction: null,
        failureClassification: 'siteverify_rejected',
      });
    },
  );

  it('bounds and sanitizes multiple upstream error codes and returned strings', async () => {
    const sensitiveUpstreamValue = `secret=${TEST_SECRET}`;
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: false,
        'error-codes': [
          'TIMEOUT-OR-DUPLICATE',
          sensitiveUpstreamValue,
          42,
          '',
          'bad_code',
          'a'.repeat(65),
          'internal-error',
          'bad request',
          'ninth-code-is-truncated',
        ],
        hostname: `bad/${TEST_TOKEN}`,
        action: `bad action ${TEST_SECRET}`,
      }),
    );

    const verification = await verifyTurnstileDetailed(request(), TEST_TOKEN);

    expect(verification.errorCodes).toEqual([
      'timeout-or-duplicate',
      'invalid-error-code',
      'invalid-error-code',
      'invalid-error-code',
      'invalid-error-code',
      'invalid-error-code',
      'internal-error',
      'invalid-error-code',
    ]);
    expect(verification.returnedHostname).toBe('invalid-hostname');
    expect(verification.returnedAction).toBe('invalid-action');
    expect(JSON.stringify(verification)).not.toContain(TEST_TOKEN);
    expect(JSON.stringify(verification)).not.toContain(TEST_SECRET);
    expect(JSON.stringify(verification)).not.toContain(sensitiveUpstreamValue);
  });

  it('fails closed on a non-2xx Siteverify response', async () => {
    fetchMock.mockResolvedValue(new Response('upstream unavailable', { status: 503 }));

    await expect(verifyTurnstileDetailed(request(), TEST_TOKEN)).resolves.toEqual({
      siteverifyHttpStatus: 503,
      success: false,
      errorCodes: [],
      returnedHostname: null,
      returnedAction: null,
      failureClassification: 'siteverify_non_2xx',
    });
  });

  it('fails closed on malformed Siteverify JSON', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{not-json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(verifyTurnstileDetailed(request(), TEST_TOKEN)).resolves.toEqual({
      siteverifyHttpStatus: 200,
      success: false,
      errorCodes: [],
      returnedHostname: null,
      returnedAction: null,
      failureClassification: 'siteverify_invalid_json',
    });
  });

  it('fails closed when the Siteverify JSON response omits success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hostname: 'dczweb.com' }));

    await expect(verifyTurnstileDetailed(request(), TEST_TOKEN)).resolves.toEqual({
      siteverifyHttpStatus: 200,
      success: false,
      errorCodes: [],
      returnedHostname: 'dczweb.com',
      returnedAction: null,
      failureClassification: 'siteverify_rejected',
    });
  });

  it('fails closed and classifies a request timeout without retaining the error', async () => {
    fetchMock.mockRejectedValue(new DOMException(`timeout ${TEST_SECRET}`, 'TimeoutError'));

    const verification = await verifyTurnstileDetailed(request(), TEST_TOKEN);

    expect(verification).toEqual({
      siteverifyHttpStatus: null,
      success: false,
      errorCodes: [],
      returnedHostname: null,
      returnedAction: null,
      failureClassification: 'siteverify_timeout',
    });
    expect(JSON.stringify(verification)).not.toContain(TEST_SECRET);
  });

  it('fails closed and classifies a network rejection without retaining the error', async () => {
    fetchMock.mockRejectedValue(new TypeError(`network ${TEST_SECRET} ${TEST_TOKEN}`));

    const verification = await verifyTurnstileDetailed(request(), TEST_TOKEN);

    expect(verification).toEqual({
      siteverifyHttpStatus: null,
      success: false,
      errorCodes: [],
      returnedHostname: null,
      returnedAction: null,
      failureClassification: 'siteverify_network_error',
    });
    expect(JSON.stringify(verification)).not.toContain(TEST_SECRET);
    expect(JSON.stringify(verification)).not.toContain(TEST_TOKEN);
  });

  it.each([null, '', '   ', 'x'.repeat(2049)])(
    'rejects a missing or malformed token without calling Siteverify',
    async (token) => {
      const verification = await verifyTurnstileDetailed(request(), token);

      expect(verification.success).toBe(false);
      expect(verification.failureClassification).toBe('siteverify_rejected');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('preserves the exported boolean compatibility contract', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(
        jsonResponse({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
      );

    await expect(verifyTurnstile(request(), TEST_TOKEN)).resolves.toBe(true);
    await expect(verifyTurnstile(request(), TEST_TOKEN)).resolves.toBe(false);
  });
});
