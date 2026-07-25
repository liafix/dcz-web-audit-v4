import { Card, CardContent } from '@/components/ui/card';
import type { MoneyLeak } from '@/lib/revenue/types';
import { leakCategoryLabel } from '@/lib/revenue/labels';

const severityLabel = { critical: 'Kritická', high: 'Vysoká', medium: 'Stredná', low: 'Nízka' } as const;

export function MoneyLeakMap({ leaks, teaser = false }: { leaks: MoneyLeak[]; teaser?: boolean }) {
  const visible = teaser ? leaks.slice(0, 2) : leaks;
  return <section id="money-leaks" aria-labelledby="money-leaks-title">
    <p className="eyebrow text-amber-200">Money Leak Map</p>
    <h2 id="money-leaks-title" className="section-title">Kde môže web brzdiť obchodnú cestu.</h2>
    <p className="mt-4 max-w-3xl leading-7 text-slate-400">Mapa nepredstiera presnú finančnú stratu. Spája zistený signál s mechanizmom, blokovaným krokom a odporúčanou opravou.</p>
    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      {visible.map((leak, index) => <Card key={leak.id} className={leak.status === 'UNKNOWN' ? 'border-slate-300/10' : 'border-amber-300/12'}><CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold tracking-[.14em] text-amber-200 uppercase">{String(index + 1).padStart(2, '0')} · {leakCategoryLabel[leak.category]}</span><span className="sample-badge">{leak.status === 'UNKNOWN' ? 'Neoverené' : `${severityLabel[leak.severity]} priorita`}</span></div>
        <h3 className="mt-4 text-xl font-semibold text-white">{leak.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{leak.mechanism}</p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><dt className="text-slate-500">Môže blokovať</dt><dd className="mt-1 text-slate-200">{leak.blockedBusinessStep}</dd></div><div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><dt className="text-slate-500">Istota / náročnosť</dt><dd className="mt-1 text-slate-200">{leak.certainty} % · {leak.effortBand}</dd></div></dl>
        {!teaser && <div className="mt-4 rounded-xl border border-blue-300/10 bg-blue-400/[.045] p-4 text-sm leading-6 text-blue-100"><strong>Odporúčaná oprava:</strong> {leak.recommendedFix}</div>}
      </CardContent></Card>)}
    </div>
    {teaser && leaks.length > visible.length && <p className="mt-4 text-sm text-slate-500">Celý report obsahuje ďalších {leaks.length - visible.length} obchodných oblastí a konkrétne opravy.</p>}
  </section>;
}
