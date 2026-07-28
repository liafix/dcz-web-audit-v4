import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { appUrl } from '@/lib/env';
import { grantReportAccess } from '@/lib/auth/report-access';
import {
  confirmReportAccessAndVerifyLead,
  findAuditById,
  markLeadNotificationSent,
  peekReportAccessToken,
} from '@/lib/db/queries';
import { scheduleFollowUpSequence } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { dczLeadEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/client';
import { PublicAppError } from '@/lib/errors/public-error';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { sha256 } from '@/lib/security/crypto';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { requestIp } from '@/lib/security/request-fingerprint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const subjectHash = await enforceRateLimit({
      action: 'report_access_confirm', subject: requestIp(request), limit: 20, windowMs: 60 * 60 * 1000,
    });
    await recordSecurityEventSafe({
      action: 'report_access_confirm',
      subjectHash,
      success: false,
      metadata: { phase: 'attempt' },
    });
    const tokenHash = sha256(token);
    const candidate = await peekReportAccessToken(tokenHash);
    if (!candidate) throw new PublicAppError({ code: 'access_expired', status: 410, publicMessage: 'Odkaz už nie je platný. Pošlite si nový odkaz z výsledku.' });
    const audit = await findAuditById(candidate.auditId);
    if (!audit || audit.expiresAt <= new Date() || audit.status !== 'ready') {
      throw new PublicAppError({ code: 'audit_unavailable', status: 410, publicMessage: 'Výsledok už nie je dostupný.' });
    }

    const access = await confirmReportAccessAndVerifyLead(tokenHash);
    if (!access || access.auditId !== audit.id || access.email !== candidate.email) {
      throw new PublicAppError({ code: 'access_expired', status: 410, publicMessage: 'Odkaz už nie je platný. Pošlite si nový odkaz z výsledku.' });
    }
    await grantReportAccess(audit.id);
    await Promise.all([
      recordFunnelEventSafe({ auditId: audit.id, event: 'result_email_confirmed' }),
      recordSecurityEventSafe({ action: 'report_access_success', subjectHash, auditId: audit.id, success: true }),
    ]);

    try {
      const scoredLead = await recalculateAndRouteLead(access.leadId);
      if (scoredLead) {
        await scheduleFollowUpSequence(scoredLead);
        await recordFunnelEventSafe({ auditId: audit.id, event: 'follow_up_scheduled', metadata: { jobs: 4 } });
      }

      if (scoredLead && !scoredLead.notificationSentAt && process.env.DCZ_NOTIFICATION_EMAIL) {
        const sent = await sendEmail({
          to: process.env.DCZ_NOTIFICATION_EMAIL,
          replyTo: scoredLead.email,
          subject: `Overený lead: ${audit.origin}`,
          html: dczLeadEmail({ audit, lead: scoredLead, adminUrl: `${appUrl()}/admin/leads/${scoredLead.id}` }),
          idempotencyKey: `verified-lead-${scoredLead.id}`,
        });
        if (sent.sent) await markLeadNotificationSent(scoredLead.id);
      }
    } catch {
      await recordSecurityEventSafe({
        action: 'report_access_post_confirm_failed',
        subjectHash,
        auditId: audit.id,
        success: false,
      });
    }

    return NextResponse.redirect(new URL(`/audit/${encodeURIComponent(audit.publicToken)}/full?verified=1`, request.url), { status: 303 });
  } catch (error) {
    const response = jsonError(error, { code: 'access_confirm_failed', status: 500, message: 'Výsledok sa nepodarilo odomknúť.', context: { route: 'access_confirm' } });
    if (response.status >= 400) return NextResponse.redirect(new URL('/audit/start?access=invalid', request.url), { status: 303 });
    return response;
  }
}
