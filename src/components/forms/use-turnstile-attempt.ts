'use client';

import { useCallback, useRef, useState } from 'react';
import type { TurnstileWidgetHandle } from '@/components/forms/turnstile-widget';

export type TurnstileAttempt =
  | { status: 'started'; token: string | null }
  | { status: 'busy' }
  | { status: 'missing' };

export function useTurnstileAttempt() {
  const widgetRef = useRef<TurnstileWidgetHandle | null>(null);
  const tokenRef = useRef<string | null>(null);
  const lockedRef = useRef(false);
  const [token, setTokenState] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onToken = useCallback((value: string | null) => {
    tokenRef.current = value;
    setTokenState(value);
  }, []);

  const begin = useCallback((tokenRequired: boolean): TurnstileAttempt => {
    if (lockedRef.current) return { status: 'busy' };
    const submissionToken = tokenRef.current;
    if (tokenRequired && !submissionToken) return { status: 'missing' };

    lockedRef.current = true;
    tokenRef.current = null;
    setTokenState(null);
    setPending(true);
    return { status: 'started', token: submissionToken };
  }, []);

  const release = useCallback((resetWidget: boolean) => {
    if (resetWidget) widgetRef.current?.reset();
    lockedRef.current = false;
    setPending(false);
  }, []);

  const clearChallenge = useCallback(() => {
    tokenRef.current = null;
    setTokenState(null);
  }, []);

  return {
    widgetRef,
    token,
    pending,
    onToken,
    begin,
    release,
    clearChallenge,
  };
}
