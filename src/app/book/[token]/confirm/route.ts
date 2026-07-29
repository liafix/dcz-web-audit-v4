import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { createBookingIntent } from '@/lib/db/revenue-queries';
import { appUrl } from '@/lib/env';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { PublicAppError } from '@/lib/errors/public-error';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requireRevenueAudit } from '@/lib/revenue/access';
import { randomToken } from '@/lib/security/crypto';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const { audit, lead } = await requireRevenueAudit(token);
    const subjectHash = await enforceRateLimit({
      action: 'booking_confirm',
      subject: `${requestIp(request)}|${lead.id}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
      auditId: audit.id,
    });
    const rawBookingUrl = process.env.DIAGNOSTIC_BOOKING_URL?.trim();
    if (!rawBookingUrl) {
      throw new PublicAppError({ code: 'booking_not_configured', status: 503, publicMessage: 'Rezervácia termínu momentálne nie je dostupná.' });
    }
    const bookingUrl = new URL(rawBookingUrl);
    if (bookingUrl.protocol !== 'https:') throw new Error('DIAGNOSTIC_BOOKING_URL must use HTTPS.');

    const publicReference = randomToken(12);
    await createBookingIntent({ auditId: audit.id, leadId: lead.id, provider: bookingUrl.hostname, publicReference });
    bookingUrl.searchParams.set('utm_source', 'dczwebaudit');
    bookingUrl.searchParams.set('utm_medium', 'revenue_diagnostic');
    bookingUrl.searchParams.set('audit_reference', publicReference);

    await recordFunnelEventSafe({ auditId: audit.id, event: 'booking_clicked', metadata: { provider: bookingUrl.hostname } });
    await recordSecurityEventSafe({ action: 'booking_confirm', subjectHash, auditId: audit.id, success: true });
    await recalculateAndRouteLead(lead.id);
    return NextResponse.redirect(bookingUrl, { status: 303 });
  } catch (error) {
    const fallback = new URL('/contact?booking=unavailable', appUrl());
    if (error instanceof PublicAppError) fallback.searchParams.set('reason', error.code);
    return NextResponse.redirect(fallback, { status: 303 });
  }
}
