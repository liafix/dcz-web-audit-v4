'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonClass } from '@/components/ui/button';
import type { AuditStatus, AuditStatusPayload } from '@/lib/audit/types';

const stages: Array<{ key: AuditStatus; label: string }> = [
  { key: 'validating', label: 'Bezpečne overujeme adresu a DNS' },
  { key: 'fetching_homepage', label: 'Načítavame verejnú titulnú stránku' },
  { key: 'checking_technical_files', label: 'Kontrolujeme robots.txt a sitemap.xml' },
  { key: 'pagespeed', label: 'Získavame dostupné mobilné metriky' },
  { key: 'extracting', label: 'Vyhodnocujeme SEO, dôveru a konverzné signály' },
  { key: 'scoring', label: 'Počítame vysvetliteľné skóre a pokrytie' },
  { key: 'assembling_report', label: 'Zostavujeme výsledok a dôkazy' },
];

const emptyPayload = (status: AuditStatus): AuditStatusPayload => ({
  status,
  currentStage: status,
  stageLabel: 'Audit čaká na spracovanie',
  ready: false,
  failed: false,
  stale: false,
  retryable: true,
  attemptCount: 0,
  maxAttempts: 3,
  lastHeartbeatAt: null,
  retryAfterMs: 0,
  message: null,
  errorId: null,
  resultUrl: null,
});

export function ProgressClient({ token, initialStatus }: { token: string; initialStatus: AuditStatus }) {
  const router = useRouter();
  const triggered = useRef(false);
  const processing = useRef(false);
  const retryCooldownUntil = useRef(0);
  const [payload, setPayload] = useState<AuditStatusPayload>(() => emptyPayload(initialStatus));
  const [networkWarning, setNetworkWarning] = useState(false);
  const [processingWarning, setProcessingWarning] = useState(false);

  const triggerProcessing = useCallback(async () => {
    if (processing.current || Date.now() < retryCooldownUntil.current) return false;
    processing.current = true;
    retryCooldownUntil.current = Date.now() + 2_500;
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/process`, {
        method: 'POST',
        cache: 'no-store',
      });
      const accepted = response.ok || response.status === 409;
      setProcessingWarning(!accepted);
      return accepted;
    } catch {
      setProcessingWarning(true);
      return false;
    } finally {
      processing.current = false;
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;

    const schedule = (delay = 1_500) => {
      if (!cancelled) timer = setTimeout(poll, delay);
    };

    async function poll() {
      try {
        const response = await fetch(`/api/audit/${encodeURIComponent(token)}/status`, { cache: 'no-store' });
        if (!response.ok) throw new Error('status_failed');
        const next = (await response.json()) as AuditStatusPayload;
        if (cancelled) return;
        failures = 0;
        setNetworkWarning(false);
        setPayload(next);
        if (next.ready && next.resultUrl) return router.replace(next.resultUrl);
        if (next.status === 'expired') return router.replace(`/audit/${encodeURIComponent(token)}/expired`);

        const canRetry = (next.stale || (next.failed && next.retryable)) && next.attemptCount < next.maxAttempts;
        if (canRetry) {
          await triggerProcessing();
          schedule(1_800);
          return;
        }
        if (!next.failed) schedule(Math.max(1_500, Math.min(5_000, next.retryAfterMs || 1_500)));
      } catch {
        failures += 1;
        if (!cancelled) {
          setNetworkWarning(failures >= 3);
          schedule(Math.min(5_000, 1_800 + failures * 500));
        }
      }
    }

    if (!triggered.current) {
      triggered.current = true;
      void triggerProcessing();
    }
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, token, triggerProcessing]);

  const currentIndex = stages.findIndex((stage) => stage.key === payload.currentStage);
  return (
    <div className="space-y-5">
      <Card><CardContent className="p-6 md:p-8">
        <div className="flex items-center gap-4">
          <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl border border-blue-300/20 bg-blue-400/10" aria-hidden="true"><span className="size-5 animate-spin rounded-full border-2 border-blue-200/25 border-t-blue-200" /></span>
          <div><p className="text-xs font-semibold tracking-[0.18em] text-blue-300 uppercase">Reálny stav spracovania</p><h2 className="mt-2 text-2xl font-semibold text-white">{payload.stageLabel}</h2><p className="mt-1 text-xs text-slate-500">Pokus {Math.max(1, payload.attemptCount)} z {payload.maxAttempts}</p></div>
        </div>
      </CardContent></Card>

      <Card><CardContent className="space-y-2">
        {stages.map((stage, index) => {
          const complete = currentIndex > index || payload.ready;
          const active = currentIndex === index && !payload.ready;
          return <div key={stage.key} className="flex items-center gap-3 rounded-xl px-3 py-3">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${complete ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200' : active ? 'border-blue-300/30 bg-blue-400/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-slate-600'}`}>
              {complete ? <svg viewBox="0 0 20 20" fill="none" className="size-4" stroke="currentColor" strokeWidth="2"><path d="m4 10 4 4 8-9" /></svg> : index + 1}
            </span><span className={active || complete ? 'text-slate-200' : 'text-slate-600'}>{stage.label}</span>
          </div>;
        })}
      </CardContent></Card>

      {networkWarning && <p role="status" className="rounded-xl border border-amber-300/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">Spojenie je nestabilné. Stav auditu skúšame načítať znova.</p>}
      {processingWarning && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">Spracovanie sa nepodarilo spustiť. Stav auditu ďalej kontrolujeme; ak je pokus dostupný, môžete ho bezpečne zopakovať.</p>}
      {payload.failed && <Card className="border-red-300/20"><CardContent>
        <h2 className="text-xl font-semibold text-white">Audit sa nepodarilo dokončiť</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{payload.message ?? 'Skúste spracovanie zopakovať alebo kontaktujte DCZ.'}</p>
        {payload.errorId && <p className="mt-2 text-xs text-slate-600">ID chyby: {payload.errorId}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          {payload.retryable && payload.attemptCount < payload.maxAttempts && <Button type="button" onClick={() => {
            void triggerProcessing().then((accepted) => {
              if (accepted) window.location.reload();
            });
          }}>Skúsiť znova</Button>}
          <Link href={`/contact?audit=${encodeURIComponent(token)}`} className={buttonClass('secondary')}>Kontaktovať DCZ</Link>
        </div>
      </CardContent></Card>}
    </div>
  );
}
