import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { findAuditById } from '@/lib/db/queries';

export default async function AdminAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const audit = await findAuditById(id);
  if (!audit) notFound();
  return <div><h1 className="text-3xl font-semibold text-white">{audit.origin}</h1><p className="mt-2 break-all text-sm text-slate-500">{audit.targetUrl}</p><div className="mt-8 grid gap-4 md:grid-cols-3"><Card><CardContent><p className="text-xs text-slate-500 uppercase">Stav</p><p className="mt-2 text-xl text-white">{audit.status}</p></CardContent></Card><Card><CardContent><p className="text-xs text-slate-500 uppercase">Skóre</p><p className="mt-2 text-xl text-white">{audit.overallScore ?? '—'}</p></CardContent></Card><Card><CardContent><p className="text-xs text-slate-500 uppercase">Dôvera</p><p className="mt-2 text-xl text-white">{audit.confidence ?? '—'}%</p></CardContent></Card></div><Card className="mt-6"><CardContent><h2 className="font-semibold text-white">Technické údaje</h2><pre className="mt-4 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-400">{JSON.stringify({ failureCode: audit.failureCode, failureMessage: audit.failureMessage, evidence: audit.evidenceJson, report: audit.reportJson }, null, 2)}</pre></CardContent></Card></div>;
}
