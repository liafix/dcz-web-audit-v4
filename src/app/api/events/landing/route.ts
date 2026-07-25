import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requestFingerprint, requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';

const schema = z.object({ event: z.enum(['landing_viewed', 'url_field_focused', 'audit_submit_attempted']) });
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = schema.safeParse(await readJsonBody(request, 2_000));
    if (!parsed.success) return NextResponse.json({ success: false }, { status: 422 });
    const subjectHash = await enforceRateLimit({ action: 'landing_event', subject: requestIp(request), limit: 50, windowMs: 60 * 60 * 1000 });
    await recordFunnelEventSafe({ event: parsed.data.event, sessionHash: requestFingerprint(request) });
    await recordSecurityEventSafe({ action: 'landing_event', subjectHash, success: true });
    return NextResponse.json({ success: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'landing_event_failed', status: 500, message: 'Event sa nepodarilo uložiť.', context: { route: 'landing_event' } });
  }
}
