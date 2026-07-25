import { createHmac } from 'node:crypto';
import { requiredSecret } from '@/lib/env';

export function requestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function requestFingerprint(request: Request): string {
  const payload = `${requestIp(request)}|${request.headers.get('user-agent') ?? 'unknown'}`;
  return createHmac('sha256', requiredSecret('REQUEST_FINGERPRINT_SECRET'))
    .update(payload)
    .digest('hex');
}
