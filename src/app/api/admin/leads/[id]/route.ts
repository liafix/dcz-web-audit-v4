import { NextResponse } from 'next/server';
import { recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { adminSession } from '@/lib/auth/admin-session';
import { rateLimitSubject } from '@/lib/rate-limit/server-rate-limit';
import { updateLeadWorkflow } from '@/lib/db/queries';
import { cancelOpenFollowUps, recalculateLeadScores } from '@/lib/db/revenue-queries';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { adminLeadUpdateSchema } from '@/lib/validation/admin';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await adminSession();
    if (!session) {
      throw new PublicAppError({
        code: 'admin_unauthorized',
        status: 401,
        publicMessage: 'Admin relácia vypršala. Prihláste sa znova.',
      });
    }
    const { id } = await context.params;
    const parsed = adminLeadUpdateSchema.safeParse(await readJsonBody(request, 12_000));
    if (!parsed.success) {
      throw new PublicAppError({ code: 'invalid_lead_update', status: 422, publicMessage: 'Skontrolujte údaje leadu.' });
    }
    const nextActionAt = parsed.data.nextActionAt ? new Date(parsed.data.nextActionAt) : null;
    const lead = await updateLeadWorkflow({
      id,
      stage: parsed.data.stage,
      notes: parsed.data.notes || null,
      owner: parsed.data.owner || null,
      nextActionAt,
    });
    if (!lead) throw new PublicAppError({ code: 'lead_not_found', status: 404, publicMessage: 'Lead neexistuje.' });
    if (['contacted', 'qualified', 'proposal', 'won', 'lost'].includes(lead.stage)) await cancelOpenFollowUps(lead.id);
    await recalculateLeadScores(lead.id);
    await recordSecurityEventSafe({ action: 'admin_lead_updated', subjectHash: rateLimitSubject(session.email), success: true, metadata: { leadId: id, stage: lead.stage } });
    return NextResponse.json({ success: true, lead }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'lead_update_failed', status: 500, message: 'Lead sa nepodarilo aktualizovať.', context: { route: 'admin_lead_update' } });
  }
}
