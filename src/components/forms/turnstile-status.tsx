'use client';

import type { TurnstileLifecycleState } from '@/components/forms/turnstile-widget';
import { Button } from '@/components/ui/button';

const STATUS_TEXT: Partial<Record<TurnstileLifecycleState, string>> = {
  script_not_requested: 'Pripravujeme bezpečnostné overenie…',
  script_loading: 'Načítavame bezpečnostné overenie…',
  script_ready: 'Pripravujeme bezpečnostné overenie…',
  widget_rendering: 'Pripravujeme bezpečnostné overenie…',
  rerendering: 'Obnovujeme bezpečnostné overenie…',
  resetting: 'Obnovujeme bezpečnostné overenie…',
  widget_visible: 'Dokončite zobrazené bezpečnostné overenie.',
  verifying: 'Overujeme bezpečnostnú kontrolu…',
  verified: 'Bezpečnostné overenie je pripravené.',
  expired: 'Platnosť bezpečnostného overenia vypršala.',
  timed_out: 'Bezpečnostné overenie vypršalo pre nečinnosť.',
  client_error: 'Bezpečnostné overenie sa nepodarilo načítať.',
  unavailable: 'Bezpečnostné overenie momentálne nie je dostupné.',
};

export function TurnstileStatus({
  phase,
  onRecover,
}: {
  phase: TurnstileLifecycleState;
  onRecover: () => void;
}) {
  const recoverable = ['expired', 'timed_out', 'client_error', 'unavailable'].includes(phase);
  const successful = phase === 'verified';
  const text = STATUS_TEXT[phase];
  if (!text) return null;

  return (
    <div
      className={
        successful
          ? 'rounded-xl border border-emerald-300/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100'
          : recoverable
            ? 'rounded-xl border border-amber-300/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-100'
            : 'rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-slate-300'
      }
      role={recoverable ? 'alert' : 'status'}
    >
      <p>{text}</p>
      {recoverable && (
        <Button type="button" variant="secondary" className="mt-3" onClick={onRecover}>
          Obnoviť overenie
        </Button>
      )}
    </div>
  );
}
