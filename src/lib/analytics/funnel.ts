import 'server-only';
import { recordFunnelEvent, recordSecurityEvent } from '@/lib/db/queries';
import { logApplicationEvent } from '@/lib/monitoring/logger';

export async function recordFunnelEventSafe(
  input: Parameters<typeof recordFunnelEvent>[0],
): Promise<void> {
  try {
    await recordFunnelEvent(input);
  } catch (error) {
    await logApplicationEvent({
      level: 'warn',
      event: 'funnel_event_failed',
      auditId: input.auditId,
      error,
      context: { funnelEvent: input.event },
    });
  }
}

export async function recordSecurityEventSafe(
  input: Parameters<typeof recordSecurityEvent>[0],
): Promise<void> {
  try {
    await recordSecurityEvent(input);
  } catch (error) {
    await logApplicationEvent({
      level: 'warn',
      event: 'security_event_failed',
      auditId: input.auditId,
      error,
      context: { securityAction: input.action },
    });
  }
}
