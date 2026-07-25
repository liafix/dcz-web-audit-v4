'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import type { QualificationInput } from '@/lib/revenue/types';
import { trackRevenueEvent } from '@/components/revenue/revenue-event-tracker';

const baseSelect = 'focus-ring min-h-12 w-full rounded-xl border border-white/12 bg-[#0b1020] px-4 text-sm text-white';

export function QualificationForm({ token, initial }: { token: string; initial: QualificationInput | null }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(Boolean(initial)); const started = useRef(false);
  function markStarted() { if (!started.current) { started.current = true; trackRevenueEvent(token, 'qualification_started'); } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null); const form = new FormData(event.currentTarget);
    const payload = { primaryConversionGoal: form.get('primaryConversionGoal'), decisionRole: form.get('decisionRole'), projectTimeline: form.get('projectTimeline'), investmentBand: form.get('investmentBand') };
    try { const response = await fetch(`/api/audit/${encodeURIComponent(token)}/qualification`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json() as { error?: string; errorId?: string }; if (!response.ok) throw new Error(`${data.error ?? 'Kvalifikáciu sa nepodarilo uložiť.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`); setSaved(true); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Kvalifikáciu sa nepodarilo uložiť.'); } finally { setPending(false); }
  }
  return <section id="qualification" className="scroll-mt-24" aria-labelledby="qualification-title"><p className="eyebrow text-violet-200">3 kvalifikačné otázky</p><h2 id="qualification-title" className="section-title">Spresnite riešenie bez dlhého obchodného formulára.</h2><form onSubmit={submit} onFocus={markStarted} className="mt-7 grid gap-5 rounded-2xl border border-violet-300/12 bg-violet-400/[.035] p-5 md:p-7">
    <label className="space-y-2 text-sm text-slate-300"><span>1. Aký výsledok má web prinášať predovšetkým?</span><select name="primaryConversionGoal" defaultValue={initial?.primaryConversionGoal ?? 'b2b_leads'} className={baseSelect}><option value="b2b_leads">Kvalifikované B2B dopyty</option><option value="bookings">Rezervácie</option><option value="orders">Objednávky/predaj</option><option value="demo_consultations">Demo alebo konzultácie</option><option value="subscriptions">Registrácie/predplatné</option><option value="other">Iný cieľ</option></select></label>
    <fieldset className="grid gap-4 md:grid-cols-2"><legend className="mb-3 text-sm text-slate-300">2. Kto rozhoduje a kedy chcete problém riešiť?</legend><label className="space-y-2 text-sm text-slate-400"><span>Rozhodovacia rola</span><select name="decisionRole" defaultValue={initial?.decisionRole ?? 'decision_maker'} className={baseSelect}><option value="decision_maker">Som rozhodovateľ</option><option value="co_decision_maker">Spolurozhodujem</option><option value="researcher">Pripravujem podklady</option></select></label><label className="space-y-2 text-sm text-slate-400"><span>Termín</span><select name="projectTimeline" defaultValue={initial?.projectTimeline ?? '90_days'} className={baseSelect}><option value="immediately">Ihneď</option><option value="30_days">Do 30 dní</option><option value="90_days">Do 90 dní</option><option value="later">Neskôr</option></select></label></fieldset>
    <label className="space-y-2 text-sm text-slate-300"><span>3. Aký rozsah investície je realistický, ak sa potvrdí obchodný prínos?</span><select name="investmentBand" defaultValue={initial?.investmentBand ?? 'business_case_first'} className={baseSelect}><option value="under_3000">do 3 000 €</option><option value="3000_7500">3 000–7 500 €</option><option value="7500_15000">7 500–15 000 €</option><option value="15000_30000">15 000–30 000 €</option><option value="30000_plus">30 000 €+</option><option value="business_case_first">Potrebujem najskôr business case</option></select></label>
    <Button type="submit" disabled={pending}>{pending ? 'Ukladáme…' : saved ? 'Aktualizovať kvalifikáciu' : 'Dokončiť kvalifikáciu'}</Button>{saved && <p className="text-sm text-emerald-200" aria-live="polite">Odpovede sú uložené a odporúčanie bolo prepočítané.</p>}{error && <p className="text-sm text-red-200" role="alert">{error}</p>}
  </form></section>;
}
