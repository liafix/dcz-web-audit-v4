'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  TurnstileLifecycleState,
  TurnstileWidgetHandle,
} from '@/components/forms/turnstile-widget';

export type TurnstileAttempt =
  | { status: 'started'; token: string | null }
  | { status: 'busy' }
  | { status: 'not_ready' }
  | { status: 'interaction_required' }
  | { status: 'recoverable' };

const RECOVERABLE_STATES = new Set<TurnstileLifecycleState>([
  'client_error',
  'unavailable',
]);

const NOT_READY_STATES = new Set<TurnstileLifecycleState>([
  'script_not_requested',
  'script_loading',
  'script_delayed',
  'script_ready',
  'widget_rendering',
  'challenge_delayed',
  'retrying',
  'refreshing',
  'verifying',
]);

export function useTurnstileAttempt() {
  const widgetRef = useRef<TurnstileWidgetHandle | null>(null);
  const tokenRef = useRef<string | null>(null);
  const lifecycleRef = useRef<TurnstileLifecycleState>('script_not_requested');
  const lockedRef = useRef(false);
  const recoveryClaimedRef = useRef(false);
  const [phase, setPhase] = useState<TurnstileLifecycleState>('script_not_requested');
  const [pending, setPending] = useState(false);

  const onToken = useCallback((value: string | null) => {
    tokenRef.current = value;
  }, []);

  const onStateChange = useCallback((value: TurnstileLifecycleState) => {
    lifecycleRef.current = value;
    if (!RECOVERABLE_STATES.has(value)) recoveryClaimedRef.current = false;
    setPhase(value);
  }, []);

  const begin = useCallback((tokenRequired: boolean): TurnstileAttempt => {
    if (lockedRef.current) return { status: 'busy' };
    if (tokenRequired) {
      if (RECOVERABLE_STATES.has(lifecycleRef.current)) return { status: 'recoverable' };
      if (lifecycleRef.current === 'widget_visible') return { status: 'interaction_required' };
      if (NOT_READY_STATES.has(lifecycleRef.current)) return { status: 'not_ready' };
      if (lifecycleRef.current !== 'verified' || !tokenRef.current) {
        return { status: 'not_ready' };
      }
    }

    const submissionToken = tokenRef.current;
    lockedRef.current = true;
    tokenRef.current = null;
    setPending(true);
    return { status: 'started', token: submissionToken };
  }, []);

  const release = useCallback((resetWidget: boolean) => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    if (resetWidget) widgetRef.current?.reset();
    setPending(false);
  }, []);

  const recover = useCallback((options?: { beforeReload?: () => void }) => {
    if (recoveryClaimedRef.current) return;
    recoveryClaimedRef.current = true;
    tokenRef.current = null;
    const result = widgetRef.current?.recover() ?? 'ignored';
    if (result === 'ignored') {
      recoveryClaimedRef.current = false;
      return;
    }
    if (result === 'reload_required') {
      options?.beforeReload?.();
      window.location.reload();
    }
  }, []);

  return {
    widgetRef,
    pending,
    phase,
    onToken,
    onStateChange,
    begin,
    release,
    recover,
    canSubmit: phase === 'verified',
    canRecover: RECOVERABLE_STATES.has(phase),
  };
}
