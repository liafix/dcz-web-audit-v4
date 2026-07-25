import { AuditTable } from '@/components/admin/audit-table';
import { LeadTable } from '@/components/admin/lead-table';
import { Card, CardContent } from '@/components/ui/card';
import { adminMetrics, listAudits, listLeads } from '@/lib/db/queries';
import { revenueAdminMetrics } from '@/lib/db/revenue-queries';

function percentage(part: number, total: number): string {
  if (total <= 0) return '0 %';
  return `${Math.round((part / total) * 100)} %`;
}

export default async function AdminDashboardPage() {
  const [metrics, revenue, audits, leads] = await Promise.all([
    adminMetrics(),
    revenueAdminMetrics(),
    listAudits(50),
    listLeads(80),
  ]);
  const cards = [
    ['Audity', metrics.audits, `${percentage(metrics.ready, metrics.audits)} dokončených`],
    ['Leady', metrics.leads, `${percentage(metrics.verifiedLeads, metrics.leads)} overených`],
    ['Priority A', revenue.priorityA, 'okamžité obchodné spracovanie'],
    ['ROI hotové', revenue.roiCompleted, `${percentage(revenue.roiCompleted, metrics.verifiedLeads)} z overených`],
    ['Kvalifikácie', revenue.qualifications, `${percentage(revenue.qualifications, metrics.verifiedLeads)} z overených`],
    ['Booking kliky', revenue.bookingClicks, `${percentage(revenue.bookedCalls, revenue.bookingClicks)} rezervovaných`],
    ['Rezervované', revenue.bookedCalls, 'najvyšší intent signál'],
    ['Briefy', revenue.briefs, `${percentage(revenue.briefs, metrics.verifiedLeads)} z overených`],
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-blue-300 uppercase">Revenue backoffice</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">DCZ WebAudit dashboard</h1>
        <p className="mt-3 text-sm text-slate-500">Najprv riešte Priority A, rezervované hovory a leady s vysokým Fit/Intent skóre.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, helper]) => (
          <Card key={label}>
            <CardContent>
              <p className="text-xs text-slate-500 uppercase">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Najnovšie audity</h2>
        <AuditTable audits={audits} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Lead routing</h2>
        <LeadTable leads={leads} />
      </section>
    </div>
  );
}
