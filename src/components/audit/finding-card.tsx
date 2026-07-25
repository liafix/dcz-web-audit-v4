import { Card, CardContent } from '@/components/ui/card';
import type { AuditFinding } from '@/lib/audit/types';

const severityStyles: Record<AuditFinding['severity'], string> = { critical: 'border-red-300/25 bg-red-400/8 text-red-100', high: 'border-orange-300/25 bg-orange-400/8 text-orange-100', medium: 'border-amber-300/25 bg-amber-400/8 text-amber-100', low: 'border-blue-300/20 bg-blue-400/8 text-blue-100', info: 'border-slate-300/20 bg-slate-400/8 text-slate-200' };
const severityLabels: Record<AuditFinding['severity'], string> = { critical: 'kritické', high: 'vysoká priorita', medium: 'stredná priorita', low: 'nižšia priorita', info: 'informácia' };
const statusLabels: Record<AuditFinding['status'], string> = { OBSERVED: 'Pozorované', INFERRED: 'Odvodené', NOT_DETECTED: 'Nenájdené v rozsahu', UNKNOWN: 'Neznáme', NOT_APPLICABLE: 'Neuplatňuje sa' };
const statusStyles: Record<AuditFinding['status'], string> = { OBSERVED: 'border-emerald-300/20 bg-emerald-400/8 text-emerald-100', INFERRED: 'border-violet-300/20 bg-violet-400/8 text-violet-100', NOT_DETECTED: 'border-amber-300/20 bg-amber-400/8 text-amber-100', UNKNOWN: 'border-slate-300/20 bg-slate-400/8 text-slate-200', NOT_APPLICABLE: 'border-slate-300/15 bg-slate-400/5 text-slate-400' };

export function FindingCard({ finding }: { finding: AuditFinding }) {
  return <Card><CardContent>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[finding.severity]}`}>{severityLabels[finding.severity]}</span><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[finding.status]}`}>{statusLabels[finding.status]}</span></div><span className="text-xs text-slate-500">Dôvera {finding.confidence}%</span></div>
    <h3 className="mt-5 text-xl font-semibold text-white">{finding.title}</h3>
    <dl className="mt-5 space-y-4 text-sm leading-6"><div><dt className="font-semibold text-slate-300">Dôkaz</dt><dd className="mt-1 text-slate-400">{finding.evidence}</dd></div><div><dt className="font-semibold text-slate-300">Obchodný dopad</dt><dd className="mt-1 text-slate-400">{finding.impact}</dd></div><div><dt className="font-semibold text-slate-300">Odporúčanie</dt><dd className="mt-1 text-slate-400">{finding.recommendation}</dd></div></dl>
    <p className="mt-5 break-all border-t border-white/8 pt-4 text-xs text-slate-600">Zdroj: {finding.sourceUrl}</p>
  </CardContent></Card>;
}
