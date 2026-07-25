import { NextResponse } from 'next/server';
import { updateBookingIntent, cancelOpenFollowUps } from '@/lib/db/revenue-queries';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { bookingWebhookSchema } from '@/lib/validation/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const secret = process.env.BOOKING_WEBHOOK_SECRET?.trim();
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
      throw new PublicAppError({ code: 'booking_webhook_unauthorized', status: 401, publicMessage: 'Unauthorized.' });
    }
    const parsed = bookingWebhookSchema.safeParse(await readJsonBody(request, 12_000));
    if (!parsed.success) throw new PublicAppError({ code: 'invalid_booking_webhook', status: 422, publicMessage: 'Invalid payload.' });
    const intent = await updateBookingIntent(parsed.data);
    if (!intent) throw new PublicAppError({ code: 'booking_reference_not_found', status: 404, publicMessage: 'Reference not found.' });
    if (parsed.data.status === 'booked') await cancelOpenFollowUps(intent.leadId);
    if (intent.auditId) await recordFunnelEventSafe({ auditId: intent.auditId, event: parsed.data.status === 'booked' ? 'booking_completed' : 'booking_cancelled' });
    await recalculateAndRouteLead(intent.leadId);
    return NextResponse.json({ success: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'booking_webhook_failed', status: 500, message: 'Webhook failed.', context: { route: 'booking_webhook' } });
  }
}
