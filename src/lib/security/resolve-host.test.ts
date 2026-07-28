import { beforeEach, describe, expect, it, vi } from 'vitest';

const dns = vi.hoisted(() => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

vi.mock('node:dns/promises', () => ({
  resolve4: dns.resolve4,
  resolve6: dns.resolve6,
}));

import { TargetFetchError } from '@/lib/errors/target-fetch-error';
import { resolvePublicHost } from '@/lib/security/resolve-host';

function dnsFailure(code: string): Error {
  return Object.assign(new Error('raw DNS details'), { code });
}

describe('resolvePublicHost diagnostics and policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['ENOTFOUND', 'dns_not_found', false],
    ['EAI_AGAIN', 'dns_temporary_failure', true],
  ] as const)('classifies %s when no address family resolves', async (code, classification, retryable) => {
    dns.resolve4.mockRejectedValue(dnsFailure(code));
    dns.resolve6.mockRejectedValue(dnsFailure(code));

    await expect(resolvePublicHost('target.example')).rejects.toMatchObject({
      classification,
      phase: 'dns',
      safeCauseCode: code,
      retryable,
    });
  });

  it('fails closed when any resolved address is private', async () => {
    dns.resolve4.mockResolvedValue(['93.184.216.34']);
    dns.resolve6.mockResolvedValue(['::1']);

    await expect(resolvePublicHost('target.example')).rejects.toMatchObject({
      classification: 'unsafe_resolved_address',
      phase: 'policy',
      retryable: false,
    });
  });

  it('validates literal IP targets without performing DNS resolution', async () => {
    await expect(resolvePublicHost('1.1.1.1')).resolves.toEqual([
      { address: '1.1.1.1', family: 4 },
    ]);
    expect(dns.resolve4).not.toHaveBeenCalled();
    expect(dns.resolve6).not.toHaveBeenCalled();
  });

  it('returns a typed policy error rather than exposing a rejected address', async () => {
    await expect(resolvePublicHost('127.0.0.1')).rejects.toBeInstanceOf(TargetFetchError);
  });
});
