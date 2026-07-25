import { Card, CardContent } from '@/components/ui/card';
import type { AuditReport } from '@/lib/audit/types';
import { businessModelLabel, verticalLabel } from '@/lib/revenue/labels';

export function ExecutivePreview({ report, teaser = false }: { report: AuditReport; teaser?: boolean }) {
  const summary = report.executiveSummary;
  return <section id="executive-summary" aria-labelledby="executive-title">
    <div className="flex flex-wrap items-center gap-2">
      <span className="sample-badge observed">Executive preview</span>
      <span className="sample-badge">{verticalLabel[report.businessProfile.vertical]}</span>
      <span className="sample-badge">{businessModelLabel[report.businessProfile.businessModel]}</span>
    </div>
    <h2 id="executive-title" className="mt-4 max-w-4xl text-3xl font-semibold text-white md:text-4xl">{summary.headline}</h2>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Rozhodovacia dôvera {summary.decisionConfidence} %. Vertikála a obchodný model sú automatická inferencia z uložených signálov, nie tvrdenie bez dôkazu.</p>
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Card className="border-rose-300/15"><CardContent><p className="text-xs font-semibold tracking-[.18em] text-rose-200 uppercase">Najväčšie riziko</p><h3 className="mt-3 text-xl font-semibold text-white">{summary.primaryRisk.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{summary.primaryRisk.explanation}</p></CardContent></Card>
      <Card className="border-blue-300/15"><CardContent><p className="text-xs font-semibold tracking-[.18em] text-blue-200 uppercase">Príležitosť</p><h3 className="mt-3 text-xl font-semibold text-white">{summary.primaryOpportunity.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{summary.primaryOpportunity.explanation}</p></CardContent></Card>
      {!teaser ? <Card className="border-violet-300/15"><CardContent><p className="text-xs font-semibold tracking-[.18em] text-violet-200 uppercase">Prvá investícia</p><h3 className="mt-3 text-xl font-semibold text-white">{summary.firstRecommendedInvestment.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{summary.firstRecommendedInvestment.reason}</p></CardContent></Card> : <Card className="border-violet-300/15"><CardContent><p className="text-xs font-semibold tracking-[.18em] text-violet-200 uppercase">Odomknutie</p><h3 className="mt-3 text-xl font-semibold text-white">Odporúčanú prvú investíciu zobrazíme v celom reporte</h3><p className="mt-3 text-sm leading-6 text-slate-400">Výstup bude naviazaný na zistené evidence a obchodný model stránky.</p></CardContent></Card>}
    </div>
  </section>;
}
