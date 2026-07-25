import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { appUrl } from '@/lib/env';
import {
  createReportAccessToken,
  findAuditByToken,
  findLeadForAuditEmail,
  markLeadEmailDelivery,
} from '@/lib/db/queries';
import { sendEmail } from '@/lib/email/client';
import { auditResultEmail } from '@/lib/email/templates';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { requestIp } from '@/lib/security/request-fingerprint';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { resendAuditSchema } from '@/lib/validation/audit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const audit = await findAuditByToken(token);
    if (!audit || audit.status !== 'ready') {
      throw new PublicAppError({ code: 'audit_not_ready', status: 404, publicMessage: 'Audit neexistuje alebo nie je pripravený.' });
    }

    const parsed = resendAuditSchema.safeParse(await readJsonBody(request, 8_000));
    if (!parsed.success) {
      throw new PublicAppError({ code: 'invalid_email', status: 422, publicMessage: 'Zadajte platný e-mail.' });
    }
    if (!(await verifyTurnstile(request, parsed.data.turnstileToken ?? null))) {
      throw new PublicAppError({ code: 'turnstile_failed', status: 422, publicMessage: 'Bezpečnostné overenie zlyhalo.' });
    }

    const subjectHash = await enforceRateLimit({
      action: 'audit_resend_attempt',
      subject: `${requestIp(request)}|${audit.id}|${parsed.data.email}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
      auditId: audit.id,
    });

    await recordSecurityEventSafe({
      action: 'audit_resend_attempt',
      subjectHash,
      auditId: audit.id,
      success: false,
    });

    const lead = await findLeadForAuditEmail(audit.id, parsed.data.email);
    if (!lead) {
      // Do not reveal whether an e-mail exists for this audit.
      return NextResponse.json({ success: true });
    }
    if (lead.emailLastSentAt && Date.now() - lead.emailLastSentAt.getTime() < 60_000) {
      throw new PublicAppError({
        code: 'resend_cooldown',
        status: 429,
        publicMessage: 'Pred ďalším odoslaním počkajte aspoň jednu minútu.',
      });
    }

    const plainToken = randomToken(40);
    await createReportAccessToken({
      auditId: audit.id,
      email: lead.email,
      tokenHash: sha256(plainToken),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });
    const sent = await sendEmail({
      to: lead.email,
      subject: `Výsledok auditu pre ${audit.origin}`,
      html: auditResultEmail({ audit, accessUrl: `${appUrl()}/access/${encodeURIComponent(plainToken)}` }),
      idempotencyKey: `audit-resend-${audit.id}-${lead.id}-${Date.now()}`,
    });
    await markLeadEmailDelivery(lead.id, { sent: sent.sent, reason: sent.reason });
    await Promise.all([
      recordSecurityEventSafe({ action: sent.sent ? 'audit_resend_success' : 'audit_resend_failed', subjectHash, auditId: audit.id, success: sent.sent }),
      recordFunnelEventSafe({ auditId: audit.id, event: sent.sent ? 'result_email_resent' : 'result_email_resend_failed' }),
    ]);

    if (!sent.sent) {
      throw new PublicAppError({
        code: 'email_delivery_failed',
        status: 503,
        publicMessage: 'E-mail sa momentálne nepodarilo odoslať. Skúste to o chvíľu.',
        internalMessage: sent.reason,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, {
      code: 'resend_failed',
      status: 500,
      message: 'E-mail sa momentálne nepodarilo odoslať.',
      context: { route: 'audit_resend' },
    });
  }
}
