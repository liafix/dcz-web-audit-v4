import ipaddr from 'ipaddr.js';

const BLOCKED_RANGES = new Set([
  'unspecified',
  'broadcast',
  'multicast',
  'linkLocal',
  'loopback',
  'private',
  'reserved',
  'carrierGradeNat',
  'uniqueLocal',
  'ipv4Mapped',
  'rfc6145',
  'rfc6052',
  '6to4',
  'teredo',
]);

export function isPublicIp(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    return !BLOCKED_RANGES.has(parsed.range());
  } catch {
    return false;
  }
}

export function assertPublicIp(address: string): void {
  if (!isPublicIp(address)) {
    throw new Error('Cieľ smeruje na nepovolenú alebo súkromnú IP adresu.');
  }
}
