import { beforeEach, describe, expect, it, vi } from 'vitest';

const undici = vi.hoisted(() => ({
  fetch: vi.fn(),
  close: vi.fn(),
  agentOptions: [] as unknown[],
}));

const dns = vi.hoisted(() => ({
  resolvePublicHost: vi.fn(),
}));

vi.mock('undici', () => ({
  Agent: class {
    constructor(options: unknown) {
      undici.agentOptions.push(options);
    }

    close() {
      return undici.close();
    }
  },
  fetch: undici.fetch,
}));

vi.mock('@/lib/security/resolve-host', () => ({
  resolvePublicHost: dns.resolvePublicHost,
}));

import { TargetFetchError } from '@/lib/errors/target-fetch-error';
import { safeFetchText } from '@/lib/security/safe-fetch';

function nativeFetchFailure(code: unknown): Error {
  return Object.assign(new TypeError('fetch failed'), {
    cause: Object.assign(new Error('private native details'), { code }),
  });
}

function htmlResponse(body = '<html>ok</html>', init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(body, { ...init, headers });
}

async function rejection(errorPromise: Promise<unknown>): Promise<TargetFetchError> {
  try {
    await errorPromise;
  } catch (error) {
    expect(error).toBeInstanceOf(TargetFetchError);
    return error as TargetFetchError;
  }
  throw new Error('Expected safe fetch to reject.');
}

describe('safeFetchText target diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dns.resolvePublicHost.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    undici.close.mockResolvedValue(undefined);
  });

  it.each([
    [403, false],
    [429, true],
    [503, true],
  ])('classifies HTTP %i without another address attempt', async (status, retryable) => {
    undici.fetch.mockResolvedValue(htmlResponse('', { status }));

    await expect(rejection(safeFetchText('https://example.com'))).resolves.toMatchObject({
      classification: 'target_http_error',
      phase: 'headers',
      safeCauseCode: 'unknown',
      retryable,
      httpStatus: status,
      addressAttempt: 1,
      totalAddressAttempts: 1,
    });
    expect(undici.fetch).toHaveBeenCalledTimes(1);
  });

  it('classifies unsupported content types', async () => {
    undici.fetch.mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(rejection(safeFetchText('https://example.com'))).resolves.toMatchObject({
      classification: 'unsupported_content_type',
      phase: 'headers',
      retryable: false,
    });
  });

  it('classifies oversized responses before reading the body', async () => {
    undici.fetch.mockResolvedValue(htmlResponse('', {
      headers: { 'content-length': '1001' },
    }));

    await expect(rejection(safeFetchText('https://example.com', { maxBytes: 1_000 }))).resolves.toMatchObject({
      classification: 'response_too_large',
      phase: 'headers',
      retryable: false,
    });
  });

  it('enforces the body-size limit when content-length is absent', async () => {
    undici.fetch.mockResolvedValue(htmlResponse('123456'));

    await expect(rejection(safeFetchText('https://example.com', { maxBytes: 5 }))).resolves.toMatchObject({
      classification: 'response_too_large',
      phase: 'body',
      retryable: false,
      addressAttempt: 1,
      totalAddressAttempts: 1,
    });
  });

  it('classifies malformed redirects', async () => {
    undici.fetch.mockResolvedValue(htmlResponse('', {
      status: 302,
      headers: { location: 'http://[malformed' },
    }));

    await expect(rejection(safeFetchText('https://example.com'))).resolves.toMatchObject({
      classification: 'redirect_failure',
      phase: 'redirect',
      retryable: false,
    });
  });

  it('preserves the default maximum of three redirects', async () => {
    undici.fetch.mockImplementation(async (url: string) => htmlResponse('', {
      status: 302,
      headers: { location: new URL(`/redirect-${undici.fetch.mock.calls.length}`, url).toString() },
    }));

    await expect(rejection(safeFetchText('https://example.com'))).resolves.toMatchObject({
      classification: 'redirect_failure',
      phase: 'redirect',
    });
    expect(undici.fetch).toHaveBeenCalledTimes(4);
  });

  it('uses the second already-resolved address after the first connection fails', async () => {
    dns.resolvePublicHost.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:4700:4700::1111', family: 6 },
    ]);
    undici.fetch
      .mockRejectedValueOnce(nativeFetchFailure('ECONNREFUSED'))
      .mockResolvedValueOnce(htmlResponse());

    await expect(safeFetchText('https://example.com')).resolves.toMatchObject({
      status: 200,
      body: '<html>ok</html>',
    });
    expect(undici.fetch).toHaveBeenCalledTimes(2);
  });

  it('reports the final address metadata when all current address attempts fail', async () => {
    dns.resolvePublicHost.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:4700:4700::1111', family: 6 },
    ]);
    undici.fetch
      .mockRejectedValueOnce(nativeFetchFailure('ECONNREFUSED'))
      .mockRejectedValueOnce(nativeFetchFailure('UND_ERR_CONNECT_TIMEOUT'));

    await expect(rejection(safeFetchText('https://example.com'))).resolves.toMatchObject({
      classification: 'connection_timeout',
      phase: 'connect',
      safeCauseCode: 'UND_ERR_CONNECT_TIMEOUT',
      retryable: true,
      addressFamily: 6,
      addressAttempt: 2,
      totalAddressAttempts: 2,
    });
    expect(undici.fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps explicit DNS resolution, three-address cap, IP pinning, and TLS verification', async () => {
    dns.resolvePublicHost.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '1.1.1.1', family: 4 },
      { address: '8.8.8.8', family: 4 },
      { address: '9.9.9.9', family: 4 },
    ]);
    undici.fetch
      .mockRejectedValueOnce(nativeFetchFailure('ECONNRESET'))
      .mockRejectedValueOnce(nativeFetchFailure('ECONNRESET'))
      .mockRejectedValueOnce(nativeFetchFailure('ECONNRESET'));

    await rejection(safeFetchText('https://example.com'));
    expect(dns.resolvePublicHost).toHaveBeenCalledWith('example.com', 4_000);
    expect(undici.fetch).toHaveBeenCalledTimes(3);

    const options = undici.agentOptions[0] as {
      connect: {
        lookup: (
          hostname: string,
          options: { all: true },
          callback: (error: null, addresses: Array<{ address: string; family: number }>) => void,
        ) => void;
        rejectUnauthorized?: boolean;
      };
    };
    expect(options.connect.rejectUnauthorized).not.toBe(false);
    const callback = vi.fn();
    options.connect.lookup('ignored.example', { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [{ address: '93.184.216.34', family: 4 }]);
  });
});
