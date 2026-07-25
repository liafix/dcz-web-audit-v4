import { NextResponse } from 'next/server';
import { buildRevenueContext } from '@/lib/revenue/context';
import { requireRevenueAudit } from '@/lib/revenue/access';
import { jsonError } from '@/lib/http/response';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const { audit, lead } = await requireRevenueAudit(token);
    const revenue = await buildRevenueContext(audit, lead);
    return NextResponse.json({ recommendation: revenue.recommendation, caseStudy: revenue.caseStudy }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'recommendation_failed', status: 500, message: 'Odporúčanie sa nepodarilo pripraviť.', context: { route: 'recommendation' } });
  }
}
