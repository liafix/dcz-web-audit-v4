import { describe, expect, it } from 'vitest';
import { normalizeUrl } from '@/lib/security/normalize-url';

describe('normalizeUrl', () => {
  it('adds https and removes query and fragment', () => {
    expect(normalizeUrl('example.com/path?utm=1#hero').url).toBe('https://example.com/path');
  });

  it.each([
    'http://localhost',
    'http://127.0.0.1',
    'http://10.0.0.5',
    'http://169.254.169.254/latest/meta-data',
    'ftp://example.com',
    'https://user:pass@example.com',
    'https://example.com:8443',
  ])('rejects unsafe target %s', (value: string) => {
    expect(() => normalizeUrl(value)).toThrow();
  });
});
