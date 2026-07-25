import { describe, expect, it } from 'vitest';
import { sha256, signPayload, verifySignedPayload } from '@/lib/security/crypto';

describe('crypto helpers', () => {
  it('hashes values without storing the plain token', () => {
    expect(sha256('secret')).toHaveLength(64);
    expect(sha256('secret')).not.toContain('secret');
  });

  it('verifies signed payloads and rejects tampering', () => {
    const token = signPayload({ auditId: '123', exp: 9999999999 }, 'long-secret');
    expect(verifySignedPayload<{ auditId: string }>(token, 'long-secret')?.auditId).toBe('123');
    expect(verifySignedPayload(`${token}x`, 'long-secret')).toBeNull();
  });
});
