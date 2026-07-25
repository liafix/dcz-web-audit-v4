import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { appUrl } from '@/lib/env';
import { createOpportunityBrief } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { opportunityBriefEmail } from '@/lib/email/templates/opportunity-brief';
import { sendEmail } from '@/lib/email/client';
import { jsonError } from '@/lib/http/response';
import { buildRevenueContext } from '@/lib/revenue/context';
import { requireRevenueAudit } from '@/lib/revenue/access';
import type { OpportunityBriefData } from '@/lib/revenue/types';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const { audit, lead } = await requireRevenueAudit(token);
    const subjectHash = await enforceRateLimit({ action: 'brief_generate', subject: `${requestIp(request)}|${lead.id}`, limit: 5, windowMs: 24 * 60 * 60 * 1000, auditId: audit.id });
    const revenue = await buildRevenueContext(audit, lead);
    const brief: OpportunityBriefData = {
      version: 'revenue-brief-v1',
      generatedAt: new Date().toISOString(),
      targetUrl: audit.targetUrl,
      executiveSummary: audit.reportJson!.executiveSummary,
      moneyLeaks: audit.reportJson!.moneyLeaks.slice(0, 4),
      roi: revenue.roi,
      qualification: revenue.qualification,
      recommendation: revenue.recommendation,
      caseStudy: revenue.caseStudy,
      disclaimer: 'Ide o predbežný rozhodovací podklad. ROI je modelový scenár, nie garancia alebo presný výpočet ušlých tržieb.',
    };
    const plainToken = randomToken(36);
    await createOpportunityBrief({
      auditId: audit.id,
      leadId: lead.id,
      brief,
      publicTokenHash: sha256(plainToken),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    });
    const briefUrl = `${appUrl()}/brief/${encodeURIComponent(plainToken)}`;
    const bookingUrl = `${appUrl()}/book/${encodeURIComponent(audit.publicToken)}`;
    const mail = await sendEmail({
      to: lead.email,
      subject: `Opportunity Brief pre ${audit.origin}`,
      html: opportunityBriefEmail({ origin: audit.origin, briefUrl, bookingUrl }),
      idempotencyKey: `opportunity-brief-${lead.id}-${Date.now()}`,
    });
    await recordFunnelEventSafe({ auditId: audit.id, event: 'brief_generated', metadata: { emailSent: mail.sent } });
    await recordSecurityEventSafe({ action: 'brief_generate', subjectHash, auditId: audit.id, success: true });
    await recalculateAndRouteLead(lead.id);
    return NextResponse.json({ briefUrl, emailSent: mail.sent }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'brief_generation_failed', status: 500, message: 'Opportunity Brief sa nepodarilo pripraviť.', context: { route: 'brief_post' } });
  }
}
