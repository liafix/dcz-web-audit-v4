import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { findQualificationByAudit, upsertQualification } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { requireRevenueAudit } from '@/lib/revenue/access';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { qualificationSchema } from '@/lib/validation/audit';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const { audit } = await requireRevenueAudit(token);
    return NextResponse.json({ qualification: await findQualificationByAudit(audit.id) }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'qualification_load_failed', status: 500, message: 'Kvalifikáciu sa nepodarilo načítať.', context: { route: 'qualification_get' } });
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const { audit, lead } = await requireRevenueAudit(token);
    const subjectHash = await enforceRateLimit({ action: 'qualification_save', subject: `${requestIp(request)}|${lead.id}`, limit: 8, windowMs: 60 * 60 * 1000, auditId: audit.id });
    const parsed = qualificationSchema.safeParse(await readJsonBody(request, 16_000));
    if (!parsed.success) throw new PublicAppError({ code: 'invalid_qualification', status: 422, publicMessage: 'Skontrolujte odpovede kvalifikácie.' });
    const record = await upsertQualification({ auditId: audit.id, leadId: lead.id, qualification: parsed.data });
    await recordFunnelEventSafe({ auditId: audit.id, event: 'qualification_completed', metadata: { decisionRole: parsed.data.decisionRole, timeline: parsed.data.projectTimeline, investmentBand: parsed.data.investmentBand } });
    await recordSecurityEventSafe({ action: 'qualification_save', subjectHash, auditId: audit.id, success: true });
    await recalculateAndRouteLead(lead.id);
    return NextResponse.json({ qualification: record }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'qualification_save_failed', status: 500, message: 'Kvalifikáciu sa nepodarilo uložiť.', context: { route: 'qualification_post' } });
  }
}
