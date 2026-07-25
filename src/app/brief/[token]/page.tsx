import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { findOpportunityBriefByHash } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import { sha256 } from '@/lib/security/crypto';
import { leakCategoryLabel } from '@/lib/revenue/labels';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

function euro(value: number): string { return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value); }

export default async function OpportunityBriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const record = await findOpportunityBriefByHash(sha256(token)); if (!record) notFound(); const brief = record.briefJson; await recordFunnelEventSafe({ auditId: record.auditId, event: 'brief_viewed' }); await recalculateAndRouteLead(record.leadId);
  return <PublicShell><article className="mx-auto max-w-5xl px-5 py-14 lg:px-8 lg:py-20"><div className="flex flex-wrap items-center gap-2"><span className="sample-badge observed">Opportunity Brief</span><span className="sample-badge">Noindex · zdieľateľný podklad</span></div><h1 className="mt-5 text-4xl font-semibold text-white md:text-6xl">Obchodné príležitosti pre analyzovaný web</h1><p className="mt-4 break-all text-sm text-slate-500">{brief.targetUrl}</p><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">{brief.executiveSummary.headline}</p>
  <section className="mt-12"><p className="eyebrow text-amber-200">Top Money Leaks</p><div className="mt-5 grid gap-4 md:grid-cols-2">{brief.moneyLeaks.map((leak) => <Card key={leak.id}><CardContent><p className="text-xs font-semibold tracking-[.14em] text-amber-200 uppercase">{leakCategoryLabel[leak.category]}</p><h2 className="mt-3 text-xl font-semibold text-white">{leak.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{leak.mechanism}</p><p className="mt-4 text-sm text-blue-100"><strong>Oprava:</strong> {leak.recommendedFix}</p></CardContent></Card>)}</div></section>
  {brief.roi && <section className="mt-12"><p className="eyebrow text-emerald-200">Modelové ROI scenáre</p><div className="mt-5 grid gap-4 md:grid-cols-3">{([['Konzervatívny', brief.roi.conservativeAnnualPotential], ['Realistický', brief.roi.realisticAnnualPotential], ['Rastový', brief.roi.growthAnnualPotential]] as const).map(([label, range]) => <Card key={label}><CardContent><p className="text-xs text-slate-500 uppercase">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{range ? `${euro(range.min)} – ${euro(range.max)}` : 'Nedostatok vstupov'}</p></CardContent></Card>)}</div><p className="mt-4 text-xs leading-5 text-amber-100/75">{brief.roi.disclaimer}</p></section>}
  <section className="mt-12"><p className="eyebrow text-blue-200">Odporúčaný smer</p><Card className="mt-5 border-blue-300/15"><CardContent><h2 className="text-3xl font-semibold text-white">{brief.recommendation.title}</h2><p className="mt-4 leading-7 text-slate-400">{brief.recommendation.summary}</p><div className="mt-5 flex flex-wrap gap-2">{brief.recommendation.recommendedModules.map((item) => <span key={item} className="sample-badge">{item}</span>)}</div></CardContent></Card></section>
  {brief.caseStudy && <section className="mt-12"><p className="eyebrow text-violet-200">Relevantný dôkaz</p><Card className="mt-5"><CardContent><h2 className="text-2xl font-semibold text-white">{brief.caseStudy.title}</h2><p className="mt-3 leading-7 text-slate-400">{brief.caseStudy.summary}</p><Link className="mt-5 inline-block text-sm font-semibold text-blue-300" href={`/case-studies/${brief.caseStudy.slug}`}>Pozrieť príklad →</Link></CardContent></Card></section>}
  <div className="mt-12 rounded-3xl border border-violet-300/15 bg-violet-500/[.05] p-8 text-center"><h2 className="text-3xl font-semibold text-white">Overte priority na diagnostickom hovore</h2><p className="mx-auto mt-4 max-w-2xl text-slate-400">DCZ odlíši reálnu obchodnú bariéru od false positive a navrhne primeraný scope.</p><a className={`${buttonClass('primary')} mt-6`} href={`/brief/${encodeURIComponent(token)}/book`}>Kontaktovať DCZ</a></div><p className="mt-8 text-xs leading-5 text-slate-600">{brief.disclaimer}</p></article></PublicShell>;
}
