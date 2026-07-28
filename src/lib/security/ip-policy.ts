import ipaddr from 'ipaddr.js';
import { TargetFetchError } from '@/lib/errors/target-fetch-error';

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
    throw new TargetFetchError({
      classification: 'unsafe_resolved_address',
      phase: 'policy',
      safeCauseCode: 'unknown',
      retryable: false,
      addressFamily: null,
      addressAttempt: 0,
      totalAddressAttempts: 0,
    });
  }
}
