import { afterEach, describe, expect, it, vi } from 'vitest';
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
});
