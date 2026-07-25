import 'server-only';
import { appUrl } from '@/lib/env';
import { findAuditById } from '@/lib/db/queries';
import {
  claimPriorityNotification,
  recalculateLeadScores,
  releasePriorityNotification,
} from '@/lib/db/revenue-queries';
import type { LeadRecord } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/client';
import { dczLeadEmail } from '@/lib/email/templates';
import { logApplicationEvent } from '@/lib/monitoring/logger';

export async function recalculateAndRouteLead(leadId: string): Promise<LeadRecord | null> {
  const lead = await recalculateLeadScores(leadId);
  if (!lead || lead.priority !== 'A' || lead.priorityNotifiedAt) return lead;

  const claimed = await claimPriorityNotification(lead.id);
  if (!claimed) return lead;
  try {
    const notificationEmail = process.env.DCZ_NOTIFICATION_EMAIL?.trim();
    const audit = claimed.auditId ? await findAuditById(claimed.auditId) : null;
    if (!notificationEmail || !audit) {
      await releasePriorityNotification(claimed.id);
      return { ...claimed, priorityNotifiedAt: null };
    }
    const sent = await sendEmail({
      to: notificationEmail,
      replyTo: claimed.email,
      subject: `Priority A lead: ${audit.origin}`,
      html: dczLeadEmail({ audit, lead: claimed, adminUrl: `${appUrl()}/admin/leads/${claimed.id}` }),
      idempotencyKey: `priority-a-${claimed.id}`,
    });
    if (!sent.sent) {
      await releasePriorityNotification(claimed.id);
      await logApplicationEvent({
        level: 'warn',
        event: 'priority_a_notification_failed',
        auditId: audit.id,
        context: { leadId: claimed.id, reason: sent.reason },
      });
      return { ...claimed, priorityNotifiedAt: null };
    }
    return claimed;
  } catch (error) {
    await releasePriorityNotification(claimed.id);
    await logApplicationEvent({
      level: 'error',
      event: 'priority_a_routing_failed',
      auditId: claimed.auditId,
      error,
      context: { leadId: claimed.id },
    });
    return { ...claimed, priorityNotifiedAt: null };
  }
}
