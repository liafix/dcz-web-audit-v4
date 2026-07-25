import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requireRevenueAudit } from '@/lib/revenue/access';
import { requestFingerprint, requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';

const schema = z.object({
  event: z.enum([
    'roi_viewed',
    'roi_started',
    'qualification_started',
    'solution_recommendation_viewed',
    'case_study_impression',
    'booking_confirmation_viewed',
    'brief_cta_viewed',
  ]),
});

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const { audit } = await requireRevenueAudit(token);
    const parsed = schema.safeParse(await readJsonBody(request, 2_000));
    if (!parsed.success) return NextResponse.json({ success: false }, { status: 422, headers: { 'cache-control': 'no-store' } });
    const subjectHash = await enforceRateLimit({
      action: 'revenue_event',
      subject: `${requestIp(request)}|${audit.id}`,
      limit: 80,
      windowMs: 60 * 60 * 1000,
      auditId: audit.id,
    });
    await recordFunnelEventSafe({
      auditId: audit.id,
      event: parsed.data.event,
      sessionHash: requestFingerprint(request),
    });
    await recordSecurityEventSafe({ action: 'revenue_event', subjectHash, auditId: audit.id, success: true });
    return NextResponse.json({ success: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, {
      code: 'revenue_event_failed',
      status: 500,
      message: 'Event sa nepodarilo uložiť.',
      context: { route: 'revenue_event' },
    });
  }
}
