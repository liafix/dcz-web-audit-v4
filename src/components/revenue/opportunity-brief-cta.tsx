'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RevenueEventTracker } from '@/components/revenue/revenue-event-tracker';

export function OpportunityBriefCta({ token }: { token: string }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null); const [url, setUrl] = useState<string | null>(null);
  async function generate() { setPending(true); setError(null); try { const response = await fetch(`/api/audit/${encodeURIComponent(token)}/brief`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); const data = await response.json() as { briefUrl?: string; error?: string; errorId?: string }; if (!response.ok || !data.briefUrl) throw new Error(`${data.error ?? 'Brief sa nepodarilo pripraviť.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`); setUrl(data.briefUrl); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Brief sa nepodarilo pripraviť.'); } finally { setPending(false); } }
  return <section id="brief" className="rounded-3xl border border-blue-300/15 bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10 p-7 md:p-10"><RevenueEventTracker token={token} event="brief_cta_viewed" /><p className="eyebrow">Opportunity Brief</p><h2 className="mt-3 text-3xl font-semibold text-white">Vytvorte executive podklad na interné rozhodnutie.</h2><p className="mt-4 max-w-3xl leading-7 text-slate-400">Brief spojí Money Leak Map, ROI scenáre, kvalifikáciu, odporúčaný rozsah a relevantný dôkaz do zdieľateľného noindex odkazu.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={generate} disabled={pending}>{pending ? 'Pripravujeme…' : 'Vygenerovať Opportunity Brief'}</Button>{url && <a href={url} className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-white/12 bg-white/[.04] px-5 py-3 text-sm font-semibold text-white">Otvoriť pripravený brief</a>}</div>{error && <p className="mt-4 text-sm text-red-200" role="alert">{error}</p>}</section>;
}
