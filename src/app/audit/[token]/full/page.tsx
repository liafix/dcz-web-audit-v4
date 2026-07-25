import { notFound, redirect } from 'next/navigation';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { ReportView, type RevenueViewContext } from '@/components/audit/report-view';
import { PublicShell } from '@/components/layout/public-shell';
import { hasReportAccess } from '@/lib/auth/report-access';
import { findAuditByToken } from '@/lib/db/queries';
import { findVerifiedLeadForAudit } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { buildRevenueContext } from '@/lib/revenue/context';

export const dynamic = 'force-dynamic';

export default async function FullAuditPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  if (audit.expiresAt <= new Date() || audit.status === 'expired') redirect(`/audit/${token}/expired`);
  if (audit.status !== 'ready' || !audit.reportJson || !audit.evidenceJson) redirect(`/audit/${token}/progress`);
  if (!(await hasReportAccess(audit.id))) redirect(`/audit/${token}/result`);
  const query = await searchParams;
  await Promise.all([
    recordFunnelEventSafe({ auditId: audit.id, event: 'full_result_viewed' }),
    recordFunnelEventSafe({ auditId: audit.id, event: 'money_leak_map_viewed' }),
  ]);
  const lead = await findVerifiedLeadForAudit(audit.id);
  if (lead) await recalculateAndRouteLead(lead.id);
  const context = lead ? await buildRevenueContext(audit, lead) : null;
  const revenue: RevenueViewContext | null = context ? {
    roiInputs: context.roiRecord?.inputsJson ?? null,
    roiResult: context.roi ?? null,
    qualification: context.qualification,
    recommendation: context.recommendation,
    caseStudy: context.caseStudy,
    bookingStatus: context.booking?.status ?? null,
  } : null;

  return <PublicShell><section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
    {query.verified === '1' && <div className="mb-8 rounded-2xl border border-emerald-300/20 bg-emerald-400/8 px-5 py-4 text-sm text-emerald-100">E-mail je overený. Celý report, ROI scenáre a kvalifikačný flow sú odomknuté.</div>}
    <nav className="sticky top-3 z-20 mb-8 hidden rounded-2xl border border-white/10 bg-[#080b14]/90 p-2 backdrop-blur-xl lg:flex" aria-label="Navigácia reportu"><a className="report-nav-link" href="#executive-summary">Súhrn</a><a className="report-nav-link" href="#money-leaks">Money Leaks</a><a className="report-nav-link" href="#findings">Zistenia</a><a className="report-nav-link" href="#roi">ROI</a><a className="report-nav-link" href="#qualification">Kvalifikácia</a><a className="report-nav-link" href="#solution">Riešenie</a><a className="report-nav-link" href="#booking">Hovor</a></nav>
    <ReportView report={audit.reportJson} evidence={audit.evidenceJson} token={token} full revenue={revenue} />
  </section></PublicShell>;
}
