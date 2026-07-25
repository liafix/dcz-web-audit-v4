import Link from 'next/link';
import { CategoryGrid } from '@/components/audit/category-grid';
import { ConfidenceBadge } from '@/components/audit/confidence-badge';
import { EvidenceSummary } from '@/components/audit/evidence-summary';
import { FindingCard } from '@/components/audit/finding-card';
import { ScoreRing } from '@/components/audit/score-ring';
import { StrengthCard } from '@/components/audit/strength-card';
import { UnlockForm } from '@/components/forms/unlock-form';
import { BookingCta } from '@/components/revenue/booking-cta';
import { ContextualOffer } from '@/components/revenue/contextual-offer';
import { ExecutivePreview } from '@/components/revenue/executive-preview';
import { MoneyLeakMap } from '@/components/revenue/money-leak-map';
import { OpportunityBriefCta } from '@/components/revenue/opportunity-brief-cta';
import { QualificationForm } from '@/components/revenue/qualification-form';
import { RelevantCaseStudy } from '@/components/revenue/relevant-case-study';
import { RoiScenarioBuilder } from '@/components/revenue/roi-scenario-builder';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import type { AuditEvidence, AuditReport } from '@/lib/audit/types';
import type { CaseStudy, QualificationInput, RoiInputs, RoiScenarioResult, SolutionRecommendation } from '@/lib/revenue/types';

export interface RevenueViewContext {
  roiInputs: RoiInputs | null;
  roiResult: RoiScenarioResult | null;
  qualification: QualificationInput | null;
  recommendation: SolutionRecommendation;
  caseStudy: CaseStudy | null;
  bookingStatus: string | null;
}

export function ReportView({ report, evidence, token, full, revenue }: { report: AuditReport; evidence: AuditEvidence; token: string; full: boolean; revenue?: RevenueViewContext | null }) {
  const findings = full ? report.findings : report.findings.slice(0, 3);
  const locked = Math.max(0, report.findings.length - findings.length);
  const topFinding = report.findings[0];

  return <div className="space-y-14">
    <section className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
      <ScoreRing score={report.overallScore} coverage={report.overallCoverage} />
      <div><ConfidenceBadge confidence={report.confidence} /><h1 className="mt-5 text-3xl font-semibold text-white md:text-5xl">{full ? 'DCZ Revenue Diagnostic' : 'Executive preview diagnostiky'}</h1><p className="mt-4 break-all text-sm text-slate-500">{report.targetUrl}</p><p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">Skóre vychádza iba z aplikovateľných uložených dôkazov. Pokrytie oddeľuje namerané signály od neznámych oblastí.</p></div>
    </section>

    <ExecutivePreview report={report} teaser={!full} />
    <MoneyLeakMap leaks={report.moneyLeaks} teaser={!full} />

    <Card><CardContent><p className="text-xs font-semibold tracking-[0.18em] text-blue-300 uppercase">Rozsah analýzy</p><div className="mt-4 flex flex-wrap gap-2">{report.analyzedScope.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-300">{item}</span>)}</div></CardContent></Card>
    <CategoryGrid scores={report.categoryScores} coverage={report.categoryCoverage} />

    <section id="findings" className="scroll-mt-24"><p className="text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">Prioritné bariéry</p><h2 className="mt-3 text-3xl font-semibold text-white">Evidence a konkrétne odporúčania</h2><div className="mt-6 grid gap-4 lg:grid-cols-2">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div></section>

    {!full && <Card className="border-blue-400/20"><CardContent className="grid gap-7 lg:grid-cols-[1fr_1.2fr] lg:items-center"><div><p className="text-sm font-semibold tracking-[0.18em] text-violet-300 uppercase">Celý výsledok</p><h2 className="mt-3 text-3xl font-semibold text-white">{locked > 0 ? `Pošlite si ďalších ${locked} zistení, celú Money Leak Map a ROI modul` : 'Pošlite si celý report a bezpečný odkaz na návrat'}</h2><p className="mt-4 leading-7 text-slate-400">Celý report otvoríte až cez časovo obmedzený e-mailový odkaz. E-mail sa overí vedomým potvrdením, nie automatickým scannerom.</p></div><UnlockForm token={token} /></CardContent></Card>}

    <section><p className="text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase">Silné stránky</p><h2 className="mt-3 text-3xl font-semibold text-white">Čo už funguje správne</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{report.strengths.slice(0, full ? 8 : 3).map((strength) => <StrengthCard key={strength.id} strength={strength} />)}</div></section>

    {full && revenue && <>
      <RoiScenarioBuilder token={token} initialInputs={revenue.roiInputs} initialResult={revenue.roiResult} />
      <QualificationForm token={token} initial={revenue.qualification} />
      <ContextualOffer recommendation={revenue.recommendation} token={token} />
      <RelevantCaseStudy study={revenue.caseStudy} auditToken={token} />
      <BookingCta token={token} status={revenue.bookingStatus} />
      <OpportunityBriefCta token={token} />
    </>}

    {full && !revenue && <Card className="border-violet-300/15"><CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-semibold tracking-[0.18em] text-violet-300 uppercase">Najlepší ďalší krok</p><h2 className="mt-3 text-2xl font-semibold text-white">{topFinding ? `Overte manuálne: ${topFinding.title}` : 'Doplňte automatický výsledok manuálnou kontrolou'}</h2></div><Link href={`/audit/${token}/manual-review`} className={buttonClass('primary')}>Požiadať o manuálnu kontrolu</Link></CardContent></Card>}

    {full && report.opportunities.length > 0 && <section><p className="text-sm font-semibold tracking-[0.2em] text-violet-300 uppercase">Doplnkové príležitosti</p><div className="mt-6 grid gap-4 md:grid-cols-2">{report.opportunities.map((opportunity) => <Card key={opportunity.id}><CardContent><h3 className="text-xl font-semibold text-white">{opportunity.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{opportunity.description}</p><a className={`${buttonClass('secondary')} mt-5`} href={opportunity.ctaUrl}>{opportunity.ctaLabel}</a></CardContent></Card>)}</div></section>}

    {full && <EvidenceSummary evidence={evidence} />}
    <Card><CardContent><h2 className="text-xl font-semibold text-white">Limity tejto diagnostiky</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-400">{report.limitations.map((limitation) => <li key={limitation} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-500" />{limitation}</li>)}</ul><Link href="/methodology" className="mt-5 inline-block text-sm font-semibold text-blue-300 hover:text-blue-200">Ako výsledok vznikol →</Link></CardContent></Card>
  </div>;
}
