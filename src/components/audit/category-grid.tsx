import type { AuditCategory } from '@/lib/audit/types';

const labels: Record<AuditCategory, string> = { technical: 'Technika', seo: 'SEO', accessibility: 'Prístupnosť', trust: 'Dôvera', conversion: 'Konverzie', revenue: 'Príjmová cesta' };

export function CategoryGrid({ scores, coverage }: { scores: Record<AuditCategory, number | null>; coverage: Record<AuditCategory, number> }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {(Object.entries(scores) as Array<[AuditCategory, number | null]>).map(([category, value]) => (
      <div key={category} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/15">
        <div className="flex items-start justify-between gap-4"><div><span className="text-sm font-medium text-slate-300">{labels[category]}</span><p className="mt-1 text-xs text-slate-600">Pokrytie {coverage[category]}%</p></div><span className="font-semibold text-white">{value ?? 'N/A'}</span></div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${value === null ? 'bg-slate-600' : 'bg-gradient-to-r from-blue-500 to-violet-400'}`} style={{ width: `${value ?? coverage[category]}%` }} /></div>
        {value === null && <p className="mt-2 text-xs text-slate-500">Nedostatočné dáta na spoľahlivé skóre.</p>}
      </div>
    ))}
  </div>;
}
