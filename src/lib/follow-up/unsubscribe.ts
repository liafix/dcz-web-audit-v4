import 'server-only';
import { requiredSecret } from '@/lib/env';
import { signPayload, verifySignedPayload } from '@/lib/security/crypto';

interface UnsubscribePayload { leadId: string; exp: number }

export function createUnsubscribeToken(leadId: string): string {
  return signPayload({ leadId, exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 }, requiredSecret('ACCESS_COOKIE_SECRET'));
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const payload = verifySignedPayload<UnsubscribePayload>(token, requiredSecret('ACCESS_COOKIE_SECRET'));
  return payload && payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}
