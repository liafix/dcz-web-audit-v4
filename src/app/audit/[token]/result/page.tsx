import { notFound, redirect } from 'next/navigation';
import { ReportView } from '@/components/audit/report-view';
import { PublicShell } from '@/components/layout/public-shell';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { hasVerifiedFunnelSession } from '@/lib/auth/funnel-verification';
import { findAuditByToken } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function AuditResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  if (audit.expiresAt <= new Date() || audit.status === 'expired') redirect(`/audit/${token}/expired`);
  if (audit.status === 'failed') redirect(`/audit/${token}/failed`);
  if (audit.status !== 'ready' || !audit.reportJson || !audit.evidenceJson) redirect(`/audit/${token}/progress`);

  await Promise.all([
    recordFunnelEventSafe({ auditId: audit.id, event: 'partial_result_viewed' }),
    recordFunnelEventSafe({ auditId: audit.id, event: 'executive_preview_viewed' }),
    recordFunnelEventSafe({ auditId: audit.id, event: 'money_leak_teaser_viewed' }),
  ]);
  const funnelVerified = await hasVerifiedFunnelSession(audit.id);

  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <ReportView report={audit.reportJson} evidence={audit.evidenceJson} token={token} full={false} funnelVerified={funnelVerified} />
      </section>
    </PublicShell>
  );
}
