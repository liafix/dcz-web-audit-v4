import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { appUrl } from '@/lib/env';
import {
  findAuditByToken,
  markLeadNotificationSent,
  upsertLead,
} from '@/lib/db/queries';
import { dczLeadEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/client';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { calculateLeadScore } from '@/lib/leads';
import { findVerifiedLeadForAudit } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requestFingerprint, requestIp } from '@/lib/security/request-fingerprint';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { manualReviewSchema } from '@/lib/validation/audit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const audit = await findAuditByToken(token);
    if (!audit) throw new PublicAppError({ code: 'audit_not_found', status: 404, publicMessage: 'Audit neexistuje.' });
    if (audit.status !== 'ready' || !audit.reportJson) {
      throw new PublicAppError({ code: 'audit_not_ready', status: 409, publicMessage: 'Audit ešte nie je pripravený.' });
    }

    const parsed = manualReviewSchema.safeParse(await readJsonBody(request, 22_000));
    if (!parsed.success) {
      throw new PublicAppError({ code: 'invalid_manual_review', status: 422, publicMessage: 'Skontrolujte povinné údaje formulára.' });
    }
    if (!(await verifyTurnstile(request, parsed.data.turnstileToken ?? null, {
      expectedHostname: new URL(appUrl()).hostname,
      expectedAction: 'manual_review',
    }))) {
      throw new PublicAppError({ code: 'turnstile_failed', status: 422, publicMessage: 'Bezpečnostné overenie zlyhalo.' });
    }

    const ipHash = await enforceRateLimit({
      action: 'manual_review_ip', subject: requestIp(request), limit: 3, windowMs: 60 * 60 * 1000, auditId: audit.id,
    });
    const emailHash = await enforceRateLimit({
      action: 'manual_review_email', subject: `${audit.id}|${parsed.data.email}`, limit: 3, windowMs: 24 * 60 * 60 * 1000, auditId: audit.id,
    });

    const leadScore = calculateLeadScore(
      audit,
      { company: parsed.data.company || null, phone: parsed.data.phone || null, primaryGoal: parsed.data.message },
      'manual_review',
    );
    const lead = await upsertLead({
      audit,
      email: parsed.data.email,
      name: parsed.data.name,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      primaryGoal: parsed.data.message,
      source: 'manual_review',
      stage: 'needs_review',
      marketingConsent: false,
      leadScore,
    });

    const fingerprint = requestFingerprint(request);
    await Promise.all([
      recordFunnelEventSafe({
        auditId: audit.id,
        event: 'manual_review_requested',
        sessionHash: fingerprint,
        metadata: { notificationPending: true },
      }),
      recordSecurityEventSafe({ action: 'manual_review_ip', subjectHash: ipHash, auditId: audit.id, success: true }),
      recordSecurityEventSafe({ action: 'manual_review_email', subjectHash: emailHash, auditId: audit.id, success: true }),
    ]);

    const scoredLead = await recalculateAndRouteLead(lead.id) ?? lead;
    const notification = process.env.DCZ_NOTIFICATION_EMAIL
      ? await sendEmail({
          to: process.env.DCZ_NOTIFICATION_EMAIL,
          replyTo: scoredLead.email,
          subject: `Manuálna kontrola: ${audit.origin}`,
          html: dczLeadEmail({ audit, lead: scoredLead, adminUrl: `${appUrl()}/admin/leads/${scoredLead.id}` }),
          idempotencyKey: `manual-review-${scoredLead.id}-${scoredLead.updatedAt.getTime()}`,
        })
      : { sent: false, reason: 'notification_email_not_configured' };
    if (notification.sent) await markLeadNotificationSent(scoredLead.id);

    const unlockLead = await findVerifiedLeadForAudit(audit.id);
    if (unlockLead) await recalculateAndRouteLead(unlockLead.id);
    return NextResponse.json({ success: true, notificationSent: notification.sent });
  } catch (error) {
    return jsonError(error, {
      code: 'manual_review_failed',
      status: 500,
      message: 'Žiadosť sa momentálne nepodarilo odoslať. Skúste to, prosím, znova.',
      context: { route: 'manual_review' },
    });
  }
}
