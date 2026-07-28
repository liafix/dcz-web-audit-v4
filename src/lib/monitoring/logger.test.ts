import { afterEach, describe, expect, it, vi } from 'vitest';
import { TargetFetchError, targetFetchDiagnostic } from '@/lib/errors/target-fetch-error';
import { logApplicationEvent } from '@/lib/monitoring/logger';

describe('logApplicationEvent', () => {
  afterEach(() => vi.restoreAllMocks());

  it('redacts credentials and personal data from error output', async () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const databaseUrl = ['postgresql://', 'user:pass', '@db.example/app?token=abc'].join('');
    await logApplicationEvent({
      level: 'error',
      event: 'test_error',
      error: new Error(`failed for person@example.com at ${databaseUrl}`),
      context: { authorization: 'Bearer secret-value' },
    });
    const serialized = String(output.mock.calls[0]?.[0]);
    expect(serialized).not.toContain('person@example.com');
    expect(serialized).not.toContain('user:pass');
    expect(serialized).not.toContain('secret-value');
    expect(serialized).toContain('[redacted]');
  });

  it('logs only allowlisted target-fetch diagnostics and identifiers', async () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const forbidden = [
      '185.158.133.1',
      'https://target.example/private/path?query=secret',
      'report_token_value',
      'person@example.com',
      'session_cookie_value',
      'authorization_secret',
    ];
    const error = new TargetFetchError({
      classification: 'connection_timeout',
      phase: 'connect',
      safeCauseCode: 'UND_ERR_CONNECT_TIMEOUT',
      retryable: true,
      addressFamily: 4,
      addressAttempt: 1,
      totalAddressAttempts: 1,
    });

    await logApplicationEvent({
      level: 'error',
      event: 'connection_timeout',
      errorId: 'AUD-SAFE1234',
      auditId: 'audit-safe-id',
      error: new Error(forbidden.join(' ')),
      context: {
        url: forbidden[1],
        token: forbidden[2],
        email: forbidden[3],
        cookie: forbidden[4],
        secret: forbidden[5],
      },
      targetFetch: {
        ...targetFetchDiagnostic(error),
        auditProcessingAttempt: 2,
      },
    });

    const serialized = String(output.mock.calls[0]?.[0]);
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      event: 'connection_timeout',
      errorId: 'AUD-SAFE1234',
      auditId: 'audit-safe-id',
      classification: 'connection_timeout',
      phase: 'connect',
      safeCauseCode: 'UND_ERR_CONNECT_TIMEOUT',
      retryable: true,
      addressFamily: 4,
      addressAttempt: 1,
      totalAddressAttempts: 1,
      auditProcessingAttempt: 2,
    });
    expect(parsed).not.toHaveProperty('message');
    expect(parsed).not.toHaveProperty('name');
    expect(parsed).not.toHaveProperty('stack');
    expect(parsed).not.toHaveProperty('context');
    for (const value of forbidden) expect(serialized).not.toContain(value);
  });
});
