import 'server-only';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { appUrl } from '@/lib/env';
import { createReportAccessToken, findAuditById, findLeadById } from '@/lib/db/queries';
import {
  findLatestBookingIntent,
  findQualificationByAudit,
  findRoiScenario,
  markFollowUpJob,
  recalculateLeadScores,
} from '@/lib/db/revenue-queries';
import { sendEmail } from '@/lib/email/client';
import { closeLoopEmail, contextualSolutionEmail, qualificationReminderEmail, roiReminderEmail } from '@/lib/email/templates/follow-up';
import { followUpPolicy } from '@/lib/follow-up/policy';
import { createUnsubscribeToken } from '@/lib/follow-up/unsubscribe';
import { buildRevenueContext } from '@/lib/revenue/context';
import type { FollowUpJobRecord } from '@/lib/db/schema';
import { randomToken, sha256 } from '@/lib/security/crypto';

async function cancelJob(job: FollowUpJobRecord, reason: string): Promise<'cancelled'> {
  await markFollowUpJob({ id: job.id, status: 'cancelled' });
  if (job.auditId) await recordFunnelEventSafe({ auditId: job.auditId, event: 'follow_up_cancelled', metadata: { kind: job.kind, reason } });
  return 'cancelled';
}

export async function processFollowUpJob(job: FollowUpJobRecord): Promise<'sent' | 'cancelled' | 'failed'> {
  const lead = await findLeadById(job.leadId);
  if (!lead || !job.auditId) return cancelJob(job, 'lead_or_audit_missing');
  const audit = await findAuditById(job.auditId);
  if (!audit || !audit.reportJson || audit.expiresAt <= new Date()) return cancelJob(job, 'audit_unavailable');

  const [booking, roi, qualification] = await Promise.all([
    findLatestBookingIntent(audit.id),
    findRoiScenario(audit.id),
    findQualificationByAudit(audit.id),
  ]);
  const policy = followUpPolicy({
    kind: job.kind,
    leadStage: lead.stage,
    marketingConsent: lead.marketingConsent,
    marketingUnsubscribed: Boolean(lead.marketingUnsubscribedAt),
    bookingStatus: booking?.status ?? null,
    hasRoi: Boolean(roi),
    hasQualification: Boolean(qualification),
  });
  if (!policy.send) return cancelJob(job, policy.reason);

  const plainAccessToken = randomToken(40);
  await createReportAccessToken({
    auditId: audit.id,
    email: lead.email,
    tokenHash: sha256(plainAccessToken),
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });
  const reportUrl = `${appUrl()}/access/${encodeURIComponent(plainAccessToken)}`;
  const bookingUrl = `${appUrl()}/book/${audit.publicToken}`;
  let subject = '';
  let html = '';
  if (job.kind === 'roi_reminder') {
    subject = `Modelový obchodný potenciál pre ${audit.origin}`;
    html = roiReminderEmail({ origin: audit.origin, reportUrl });
  } else if (job.kind === 'qualification_reminder') {
    subject = `Spresnite odporúčanie pre ${audit.origin}`;
    html = qualificationReminderEmail({ origin: audit.origin, reportUrl });
  } else {
    const revenue = await buildRevenueContext(audit, lead);
    const unsubscribeUrl = `${appUrl()}/unsubscribe/${encodeURIComponent(createUnsubscribeToken(lead.id))}`;
    if (job.kind === 'contextual_solution') {
      subject = `Odporúčaný ďalší krok pre ${audit.origin}`;
      html = contextualSolutionEmail({ origin: audit.origin, reportUrl, bookingUrl, recommendation: revenue.recommendation, caseStudy: revenue.caseStudy, unsubscribeUrl });
    } else {
      subject = `Uzavrieme diagnostiku pre ${audit.origin}?`;
      html = closeLoopEmail({ origin: audit.origin, bookingUrl, unsubscribeUrl });
    }
  }

  const sent = await sendEmail({ to: lead.email, subject, html, idempotencyKey: `follow-up-${job.id}-${job.attemptCount}` });
  if (!sent.sent) {
    const attempts = job.attemptCount;
    await markFollowUpJob({
      id: job.id,
      status: attempts >= 3 ? 'failed' : 'scheduled',
      error: sent.reason,
      retryAt: attempts >= 3 ? null : new Date(Date.now() + attempts * 30 * 60 * 1000),
    });
    await recordFunnelEventSafe({ auditId: audit.id, event: 'follow_up_failed', metadata: { kind: job.kind, attempts } });
    return 'failed';
  }
  await markFollowUpJob({ id: job.id, status: 'sent' });
  await recordFunnelEventSafe({ auditId: audit.id, event: 'follow_up_sent', metadata: { kind: job.kind } });
  await recalculateLeadScores(lead.id);
  return 'sent';
}
