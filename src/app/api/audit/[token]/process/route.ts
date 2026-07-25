import { NextResponse } from 'next/server';
import { recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { processAudit } from '@/lib/audit/pipeline';
import { findAuditByToken, resetAuditForRetry } from '@/lib/db/queries';
import { PublicAppError } from '@/lib/errors/public-error';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_ATTEMPTS = 3;

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const audit = await findAuditByToken(token);
    if (!audit) {
      throw new PublicAppError({ code: 'audit_not_found', status: 404, publicMessage: 'Audit neexistuje.' });
    }
    if (audit.expiresAt <= new Date()) {
      throw new PublicAppError({ code: 'audit_expired', status: 410, publicMessage: 'Platnosť auditu vypršala.' });
    }

    const subjectHash = await enforceRateLimit({
      action: 'audit_process',
      subject: `${requestIp(request)}|${audit.id}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
      auditId: audit.id,
    });
    await recordSecurityEventSafe({ action: 'audit_process', subjectHash, auditId: audit.id, success: true });

    if (audit.status === 'ready') return NextResponse.json({ status: 'ready' });
    if (audit.status === 'failed') {
      if (audit.attemptCount >= MAX_ATTEMPTS || !(await resetAuditForRetry(audit.id, MAX_ATTEMPTS))) {
        throw new PublicAppError({
          code: 'audit_failed',
          status: 409,
          publicMessage: audit.failureMessage ?? 'Audit sa nepodarilo dokončiť.',
        });
      }
    }

    const result = await processAudit(audit.id);
    return NextResponse.json({ status: result }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, {
      code: 'audit_process_failed',
      status: 500,
      message: 'Spracovanie auditu sa nepodarilo spustiť. Skúste to znova.',
      context: { route: 'audit_process' },
    });
  }
}
