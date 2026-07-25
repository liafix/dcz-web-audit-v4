import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { adminSession } from '@/lib/auth/admin-session';
import { findLeadById } from '@/lib/db/queries';
import {
  cancelOpenFollowUps,
  findLatestBookingIntent,
  updateBookingIntent,
} from '@/lib/db/revenue-queries';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { rateLimitSubject } from '@/lib/rate-limit/server-rate-limit';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { adminBookingUpdateSchema } from '@/lib/validation/admin';

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await adminSession();
    if (!session) throw new PublicAppError({ code: 'admin_unauthorized', status: 401, publicMessage: 'Admin relácia vypršala.' });
    const { id } = await context.params;
    const parsed = adminBookingUpdateSchema.safeParse(await readJsonBody(request, 4_000));
    if (!parsed.success) throw new PublicAppError({ code: 'invalid_booking_update', status: 422, publicMessage: 'Neplatný stav rezervácie.' });
    const lead = await findLeadById(id);
    if (!lead?.auditId) throw new PublicAppError({ code: 'lead_not_found', status: 404, publicMessage: 'Lead alebo audit neexistuje.' });
    const booking = await findLatestBookingIntent(lead.auditId);
    if (!booking) throw new PublicAppError({ code: 'booking_not_found', status: 404, publicMessage: 'Lead zatiaľ nemá booking intent.' });
    const updated = await updateBookingIntent({ publicReference: booking.publicReference, status: parsed.data.status, providerEventId: `admin:${session.email}` });
    if (!updated) throw new PublicAppError({ code: 'booking_not_found', status: 404, publicMessage: 'Rezervácia neexistuje.' });
    if (parsed.data.status === 'booked') await cancelOpenFollowUps(lead.id);
    await recordFunnelEventSafe({ auditId: lead.auditId, event: parsed.data.status === 'booked' ? 'booking_completed' : 'booking_cancelled', metadata: { source: 'admin' } });
    await recalculateAndRouteLead(lead.id);
    await recordSecurityEventSafe({ action: 'admin_booking_updated', subjectHash: rateLimitSubject(session.email), auditId: lead.auditId, success: true, metadata: { leadId: lead.id, status: parsed.data.status } });
    return NextResponse.json({ success: true, booking: updated }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'admin_booking_update_failed', status: 500, message: 'Rezerváciu sa nepodarilo aktualizovať.', context: { route: 'admin_booking_update' } });
  }
}
