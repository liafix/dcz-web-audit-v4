import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { appUrl } from '@/lib/env';
import {
  createReportAccessToken,
  findAuditByToken,
  markLeadEmailDelivery,
  upsertLead,
} from '@/lib/db/queries';
import { auditResultEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/client';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { calculateLeadScore } from '@/lib/leads';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { requestFingerprint, requestIp } from '@/lib/security/request-fingerprint';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { unlockAuditSchema } from '@/lib/validation/audit';

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
    if (audit.expiresAt <= new Date()) {
      throw new PublicAppError({ code: 'audit_expired', status: 410, publicMessage: 'Platnosť auditu vypršala.' });
    }

    const parsed = unlockAuditSchema.safeParse(await readJsonBody(request, 18_000));
    if (!parsed.success) {
      throw new PublicAppError({
        code: 'invalid_lead_data',
        status: 422,
        publicMessage: 'Skontrolujte e-mail a formulárové údaje.',
      });
    }
    if (!(await verifyTurnstile(request, parsed.data.turnstileToken ?? null))) {
      throw new PublicAppError({
        code: 'turnstile_failed',
        status: 422,
        publicMessage: 'Bezpečnostné overenie zlyhalo. Skúste to znova.',
      });
    }

    const ipSubject = await enforceRateLimit({
      action: 'audit_unlock_ip',
      subject: requestIp(request),
      limit: 5,
      windowMs: 15 * 60 * 1000,
      auditId: audit.id,
    });
    const emailSubject = await enforceRateLimit({
      action: 'audit_unlock_email',
      subject: `${audit.id}|${parsed.data.email}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      auditId: audit.id,
    });

    const leadScore = calculateLeadScore(
      audit,
      {
        company: parsed.data.company || null,
        phone: parsed.data.phone || null,
        primaryGoal: parsed.data.primaryGoal || null,
      },
      'audit_unlock',
    );
    const lead = await upsertLead({
      audit,
      email: parsed.data.email,
      name: parsed.data.name || null,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      primaryGoal: parsed.data.primaryGoal || null,
      source: 'audit_unlock',
      stage: 'pending_email_verification',
      marketingConsent: parsed.data.marketingConsent,
      leadScore,
    });

    const plainToken = randomToken(40);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await createReportAccessToken({
      auditId: audit.id,
      email: parsed.data.email,
      tokenHash: sha256(plainToken),
      expiresAt,
    });

    const accessUrl = `${appUrl()}/access/${encodeURIComponent(plainToken)}`;
    const userMail = await sendEmail({
      to: parsed.data.email,
      subject: `Overte e-mail a otvorte výsledok pre ${audit.origin}`,
      html: auditResultEmail({ audit, accessUrl }),
      idempotencyKey: `audit-result-v4-${audit.id}-${lead.id}-${Date.now()}`,
    });
    await markLeadEmailDelivery(lead.id, { sent: userMail.sent, reason: userMail.reason });

    const fingerprint = requestFingerprint(request);
    await Promise.all([
      recordFunnelEventSafe({
        auditId: audit.id,
        event: 'unlock_submitted',
        sessionHash: fingerprint,
        metadata: { leadScore, emailSent: userMail.sent },
      }),
      recordSecurityEventSafe({ action: 'audit_unlock_ip', subjectHash: ipSubject, auditId: audit.id, success: userMail.sent }),
      recordSecurityEventSafe({ action: 'audit_unlock_email', subjectHash: emailSubject, auditId: audit.id, success: userMail.sent }),
    ]);

    if (!userMail.sent) {
      throw new PublicAppError({
        code: 'email_delivery_failed',
        status: 503,
        publicMessage: 'E-mail s výsledkom sa momentálne nepodarilo odoslať. Kontakt bol bezpečne uložený; skúste odoslanie zopakovať o chvíľu.',
        internalMessage: userMail.reason,
      });
    }

    return NextResponse.json({
      checkEmailUrl: `/audit/${encodeURIComponent(token)}/check-email`,
      emailSent: true,
    });
  } catch (error) {
    return jsonError(error, {
      code: 'unlock_failed',
      status: 500,
      message: 'Výsledok sa momentálne nepodarilo odoslať. Skúste to, prosím, znova.',
      context: { route: 'audit_unlock' },
    });
  }
}
