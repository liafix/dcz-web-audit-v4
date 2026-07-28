import { describe, expect, it } from 'vitest';
import {
  classifyTargetFetchError,
  safeCauseCode,
  TargetFetchError,
} from '@/lib/errors/target-fetch-error';
import {
  safeAuditFailure,
  TARGET_CONNECTION_TIMEOUT_PUBLIC_MESSAGE,
} from '@/lib/errors/public-error';

function nativeFetchFailure(code: unknown): Error {
  const cause = Object.assign(new Error('native details must not escape'), { code });
  return Object.assign(new TypeError('fetch failed'), { cause });
}

describe('target fetch error classification', () => {
  it.each([
    ['UND_ERR_CONNECT_TIMEOUT', 'connection_timeout', 'connect', true],
    ['ETIMEDOUT', 'connection_timeout', 'connect', true],
    ['ECONNREFUSED', 'connection_refused', 'connect', true],
    ['ECONNRESET', 'connection_reset', 'connect', true],
    ['ENOTFOUND', 'dns_not_found', 'dns', false],
    ['EAI_AGAIN', 'dns_temporary_failure', 'dns', true],
    ['UND_ERR_HEADERS_TIMEOUT', 'headers_timeout', 'headers', true],
    ['UND_ERR_BODY_TIMEOUT', 'body_timeout', 'body', true],
    ['CERT_HAS_EXPIRED', 'tls_certificate_expired', 'tls', false],
    ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'tls_certificate_untrusted', 'tls', false],
    ['ERR_TLS_CERT_ALTNAME_INVALID', 'tls_hostname_mismatch', 'tls', false],
  ] as const)(
    'maps %s to %s',
    (code, classification, phase, retryable) => {
      expect(classifyTargetFetchError(nativeFetchFailure(code))).toMatchObject({
        classification,
        phase,
        safeCauseCode: code,
        retryable,
      });
    },
  );

  it('maps a DNS ETIMEDOUT cause to a DNS timeout when resolution is the active phase', () => {
    expect(classifyTargetFetchError(nativeFetchFailure('ETIMEDOUT'), { phase: 'dns' })).toMatchObject({
      classification: 'dns_timeout',
      phase: 'dns',
      safeCauseCode: 'ETIMEDOUT',
      retryable: true,
    });
  });

  it.each([
    ['missing cause', new TypeError('fetch failed')],
    ['malformed cause', Object.assign(new TypeError('fetch failed'), { cause: 'invalid' })],
    ['malformed cause code', nativeFetchFailure({ value: 'ECONNRESET' })],
    ['unknown cause code', nativeFetchFailure('EHOSTUNREACH')],
  ])('sanitizes %s to unknown', (_label, error) => {
    expect(safeCauseCode(error)).toBe('unknown');
    expect(classifyTargetFetchError(error)).toMatchObject({
      classification: 'unknown_network_error',
      safeCauseCode: 'unknown',
    });
  });

  it('maps connection timeout to the approved Slovak public message', () => {
    const failure = safeAuditFailure(new TargetFetchError({
      classification: 'connection_timeout',
      phase: 'connect',
      safeCauseCode: 'UND_ERR_CONNECT_TIMEOUT',
      retryable: true,
      addressFamily: 4,
      addressAttempt: 1,
      totalAddressAttempts: 1,
    }));

    expect(failure).toEqual({
      code: 'connection_timeout',
      publicMessage:
        'Cieľový server sa z našej auditnej infraštruktúry nepodarilo kontaktovať v časovom limite. Môže byť dočasne nedostupný alebo môže existovať problém v sieťovej ceste. Skúste audit neskôr.',
      internalMessage: 'Target connection timed out.',
    });
    expect(failure.publicMessage).toBe(TARGET_CONNECTION_TIMEOUT_PUBLIC_MESSAGE);
  });
});
