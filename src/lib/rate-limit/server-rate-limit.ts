import 'server-only';
import { createHmac } from 'node:crypto';
import { countSecurityEvents, recordSecurityEvent } from '@/lib/db/queries';
import { requiredSecret } from '@/lib/env';
import { PublicAppError } from '@/lib/errors/public-error';

export function rateLimitSubject(value: string): string {
  return createHmac('sha256', requiredSecret('REQUEST_FINGERPRINT_SECRET'))
    .update(value.trim().toLowerCase())
    .digest('hex');
}

export async function enforceRateLimit(input: {
  action: string;
  subject: string;
  limit: number;
  windowMs: number;
  auditId?: string | null;
}): Promise<string> {
  const subjectHash = rateLimitSubject(input.subject);
  const count = await countSecurityEvents({
    action: input.action,
    subjectHash,
    since: new Date(Date.now() - input.windowMs),
  });
  if (count >= input.limit) {
    await recordSecurityEvent({
      action: `${input.action}_blocked`,
      subjectHash,
      auditId: input.auditId,
      success: false,
    });
    throw new PublicAppError({
      code: 'rate_limited',
      status: 429,
      publicMessage: 'Dosiahli ste bezpečnostný limit. Skúste to, prosím, neskôr.',
    });
  }
  return subjectHash;
}
