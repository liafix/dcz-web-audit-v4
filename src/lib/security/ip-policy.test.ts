import { describe, expect, it } from 'vitest';
import { isPublicIp } from '@/lib/security/ip-policy';

describe('isPublicIp', () => {
  it.each(['127.0.0.1', '10.0.0.1', '192.168.1.1', '169.254.169.254', '::1', 'fc00::1'])(
    'blocks %s',
    (value: string) => expect(isPublicIp(value)).toBe(false),
  );

  it.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111'])('allows %s', (value: string) => {
    expect(isPublicIp(value)).toBe(true);
  });
});
