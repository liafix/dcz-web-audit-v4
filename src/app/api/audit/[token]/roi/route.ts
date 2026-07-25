import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { findRoiScenario, upsertRoiScenario } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { calculateRoiScenarios } from '@/lib/revenue/roi';
import { requireRevenueAudit } from '@/lib/revenue/access';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { roiScenarioSchema } from '@/lib/validation/audit';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const { audit } = await requireRevenueAudit(token);
    const roi = await findRoiScenario(audit.id);
    return NextResponse.json({ roi }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'roi_load_failed', status: 500, message: 'ROI scenár sa nepodarilo načítať.', context: { route: 'roi_get' } });
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const { audit, lead } = await requireRevenueAudit(token);
    const subjectHash = await enforceRateLimit({ action: 'roi_save', subject: `${requestIp(request)}|${audit.id}`, limit: 12, windowMs: 60 * 60 * 1000, auditId: audit.id });
    const parsed = roiScenarioSchema.safeParse(await readJsonBody(request, 16_000));
    if (!parsed.success) throw new PublicAppError({ code: 'invalid_roi_data', status: 422, publicMessage: 'Skontrolujte zadané ekonomické údaje.' });
    const result = calculateRoiScenarios(parsed.data);
    const record = await upsertRoiScenario({ auditId: audit.id, leadId: lead.id, inputs: parsed.data, result });
    await recordFunnelEventSafe({ auditId: audit.id, event: 'roi_completed', metadata: { hasBaseline: result.baselineMonthlyValue !== null } });
    await recordSecurityEventSafe({ action: 'roi_save', subjectHash, auditId: audit.id, success: true });
    await recalculateAndRouteLead(lead.id);
    return NextResponse.json({ roi: record }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'roi_save_failed', status: 500, message: 'ROI scenár sa nepodarilo uložiť.', context: { route: 'roi_post' } });
  }
}
