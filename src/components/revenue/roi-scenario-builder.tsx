'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RoiInputs, RoiScenarioResult } from '@/lib/revenue/types';
import { trackRevenueEvent } from '@/components/revenue/revenue-event-tracker';

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}
function euro(value: number): string { return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value); }

export function RoiScenarioBuilder({ token, initialInputs, initialResult }: { token: string; initialInputs: RoiInputs | null; initialResult: RoiScenarioResult | null }) {
  const router = useRouter();
  const [result, setResult] = useState(initialResult);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  useEffect(() => { trackRevenueEvent(token, 'roi_viewed'); }, [token]);
  function markStarted() { if (!started.current) { started.current = true; trackRevenueEvent(token, 'roi_started'); } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const form = new FormData(event.currentTarget);
    const payload: RoiInputs = { monthlyVisitors: numberOrNull(form.get('monthlyVisitors')), monthlyConversions: numberOrNull(form.get('monthlyConversions')), averageCustomerValue: numberOrNull(form.get('averageCustomerValue')), closeRate: numberOrNull(form.get('closeRate')), grossMargin: numberOrNull(form.get('grossMargin')), currency: 'EUR' };
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/roi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json() as { roi?: { scenarioJson: RoiScenarioResult }; error?: string; errorId?: string };
      if (!response.ok || !data.roi) throw new Error(`${data.error ?? 'ROI scenár sa nepodarilo uložiť.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      setResult(data.roi.scenarioJson); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'ROI scenár sa nepodarilo uložiť.'); }
    finally { setPending(false); }
  }
  return <section id="roi" className="scroll-mt-24" aria-labelledby="roi-title"><p className="eyebrow text-emerald-200">ROI scenáre</p><h2 id="roi-title" className="section-title">Preložte bariéru do modelového obchodného potenciálu.</h2><p className="mt-4 max-w-3xl leading-7 text-slate-400">Zadajte približné hodnoty. „Neviem“ môžete ponechať prázdne. Systém nevydáva scenár za garanciu.</p>
    <form onSubmit={submit} onFocus={markStarted} className="mt-7 grid gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:grid-cols-2 md:p-7">
      <label className="space-y-2 text-sm text-slate-300"><span>Mesačná návštevnosť</span><Input name="monthlyVisitors" inputMode="decimal" defaultValue={initialInputs?.monthlyVisitors ?? ''} placeholder="napr. 3000" /></label>
      <label className="space-y-2 text-sm text-slate-300"><span>Dopyty / rezervácie mesačne</span><Input name="monthlyConversions" inputMode="decimal" defaultValue={initialInputs?.monthlyConversions ?? ''} placeholder="napr. 15" /></label>
      <label className="space-y-2 text-sm text-slate-300"><span>Priemerná hodnota zákazníka (€)</span><Input name="averageCustomerValue" inputMode="decimal" defaultValue={initialInputs?.averageCustomerValue ?? ''} placeholder="napr. 5000" /></label>
      <label className="space-y-2 text-sm text-slate-300"><span>Close rate (%)</span><Input name="closeRate" inputMode="decimal" defaultValue={initialInputs?.closeRate ?? ''} placeholder="napr. 20" /></label>
      <label className="space-y-2 text-sm text-slate-300"><span>Hrubá marža (%) — voliteľné</span><Input name="grossMargin" inputMode="decimal" defaultValue={initialInputs?.grossMargin ?? ''} placeholder="napr. 50" /></label>
      <div className="flex items-end"><Button type="submit" disabled={pending} className="w-full">{pending ? 'Počítame…' : 'Vypočítať modelové scenáre'}</Button></div>
      {error && <p className="md:col-span-2 text-sm text-red-200" role="alert">{error}</p>}
    </form>
    {result && <div className="mt-6" aria-live="polite"><div className="grid gap-4 md:grid-cols-3">{([['Konzervatívny', result.conservativeAnnualPotential], ['Realistický', result.realisticAnnualPotential], ['Rastový', result.growthAnnualPotential]] as const).map(([label, range]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs font-semibold tracking-[.14em] text-slate-500 uppercase">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{range ? `${euro(range.min)} – ${euro(range.max)}` : 'Nedostatok vstupov'}</p><p className="mt-2 text-xs text-slate-500">modelový ročný potenciál</p></div>)}</div><ul className="mt-4 space-y-1 text-xs leading-5 text-slate-500">{result.assumptions.map((item) => <li key={item}>• {item}</li>)}</ul><p className="mt-3 text-xs leading-5 text-amber-100/75">{result.disclaimer}</p></div>}
  </section>;
}
