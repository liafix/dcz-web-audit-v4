import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import type { CaseStudy } from '@/lib/revenue/types';
import { RevenueEventTracker } from '@/components/revenue/revenue-event-tracker';

const proofLabel: Record<CaseStudy['proofType'], string> = { verified_client_result: 'Overený klientsky výsledok', delivered_project: 'Dodané riešenie', demo: 'Demo', concept: 'Modelový koncept' };

export function RelevantCaseStudy({ study, auditToken }: { study: CaseStudy | null; auditToken: string }) {
  if (!study) return null;
  return <section id="proof" aria-labelledby="proof-title"><RevenueEventTracker token={auditToken} event="case_study_impression" /><p className="eyebrow text-emerald-200">Relevantný dôkaz</p><Card className="mt-5 border-emerald-300/12"><CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><span className="sample-badge observed">{proofLabel[study.proofType]}</span><h2 id="proof-title" className="mt-4 text-2xl font-semibold text-white">{study.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{study.summary}</p>{study.disclaimer && <p className="mt-3 text-xs leading-5 text-slate-500">{study.disclaimer}</p>}</div><Link href={`/case-studies/${study.slug}?audit=${encodeURIComponent(auditToken)}`} className={buttonClass('secondary')}>Pozrieť príklad riešenia</Link></CardContent></Card></section>;
}
