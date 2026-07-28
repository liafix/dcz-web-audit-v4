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
  'expired',
  'timed_out',
  'client_error',
  'unavailable',
]);

const NOT_READY_STATES = new Set<TurnstileLifecycleState>([
  'script_not_requested',
  'script_loading',
  'script_ready',
  'widget_rendering',
  'resetting',
  'rerendering',
  'verifying',
]);

export function useTurnstileAttempt() {
  const widgetRef = useRef<TurnstileWidgetHandle | null>(null);
  const tokenRef = useRef<string | null>(null);
  const lifecycleRef = useRef<TurnstileLifecycleState>('script_not_requested');
  const lockedRef = useRef(false);
  const [phase, setPhase] = useState<TurnstileLifecycleState>('script_not_requested');
  const [pending, setPending] = useState(false);

  const onToken = useCallback((value: string | null) => {
    tokenRef.current = value;
  }, []);

  const onStateChange = useCallback((value: TurnstileLifecycleState) => {
    lifecycleRef.current = value;
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
    if (resetWidget) widgetRef.current?.reset();
    lockedRef.current = false;
    setPending(false);
  }, []);

  const recover = useCallback(() => {
    tokenRef.current = null;
    widgetRef.current?.recover();
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
