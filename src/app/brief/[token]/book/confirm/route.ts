import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { createBookingIntent, findOpportunityBriefByHash } from '@/lib/db/revenue-queries';
import { appUrl } from '@/lib/env';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { PublicAppError } from '@/lib/errors/public-error';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const record = await findOpportunityBriefByHash(sha256(token));
    if (!record || !record.auditId) {
      throw new PublicAppError({ code: 'brief_expired', status: 410, publicMessage: 'Opportunity Brief už nie je dostupný.' });
    }
    const subjectHash = await enforceRateLimit({
      action: 'brief_booking_confirm',
      subject: `${requestIp(request)}|${record.id}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
      auditId: record.auditId,
    });
    const rawBookingUrl = process.env.DIAGNOSTIC_BOOKING_URL?.trim();
    if (!rawBookingUrl) throw new PublicAppError({ code: 'booking_not_configured', status: 503, publicMessage: 'Rezervácia momentálne nie je dostupná.' });
    const bookingUrl = new URL(rawBookingUrl);
    if (bookingUrl.protocol !== 'https:') throw new Error('DIAGNOSTIC_BOOKING_URL must use HTTPS.');

    const publicReference = randomToken(12);
    await createBookingIntent({ auditId: record.auditId, leadId: record.leadId, provider: bookingUrl.hostname, publicReference });
    bookingUrl.searchParams.set('utm_source', 'dczwebaudit');
    bookingUrl.searchParams.set('utm_medium', 'opportunity_brief');
    bookingUrl.searchParams.set('audit_reference', publicReference);

    await Promise.all([
      recordFunnelEventSafe({ auditId: record.auditId, event: 'brief_booking_clicked', metadata: { provider: bookingUrl.hostname } }),
      recordFunnelEventSafe({ auditId: record.auditId, event: 'booking_clicked', metadata: { provider: bookingUrl.hostname, source: 'opportunity_brief' } }),
    ]);
    await recordSecurityEventSafe({ action: 'brief_booking_confirm', subjectHash, auditId: record.auditId, success: true });
    await recalculateAndRouteLead(record.leadId);
    return NextResponse.redirect(bookingUrl, { status: 303 });
  } catch (error) {
    const fallback = new URL('/contact?booking=unavailable', appUrl());
    if (error instanceof PublicAppError) fallback.searchParams.set('reason', error.code);
    return NextResponse.redirect(fallback, { status: 303 });
  }
}
