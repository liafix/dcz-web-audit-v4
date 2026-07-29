'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export type TurnstileLifecycleState =
  | 'script_not_requested'
  | 'script_loading'
  | 'script_delayed'
  | 'script_ready'
  | 'widget_rendering'
  | 'challenge_delayed'
  | 'widget_visible'
  | 'verifying'
  | 'verified'
  | 'retrying'
  | 'refreshing'
  | 'client_error'
  | 'unavailable';

interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  theme: 'dark';
  size?: 'compact' | 'flexible';
  appearance: 'interaction-only';
  execution: 'render';
  retry: 'auto';
  'retry-interval': number;
  'refresh-expired': 'auto';
  'refresh-timeout': 'auto';
  'response-field': false;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': (code?: string) => boolean;
  'timeout-callback': () => void;
  'before-interactive-callback': () => void;
  'after-interactive-callback': () => void;
  'unsupported-callback': () => void;
}

type TurnstileBridgeStatus = 'loading' | 'ready' | 'failed';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
    __dczTurnstileBridge?: {
      status: TurnstileBridgeStatus;
    };
    __dczTurnstileReady?: () => void;
  }
}

export type TurnstileRecoveryResult = 'recovered' | 'reload_required' | 'ignored';

export interface TurnstileWidgetHandle {
  reset: () => void;
  recover: () => TurnstileRecoveryResult;
}

interface TurnstileWidgetProps {
  siteKey?: string;
  action: string;
  onToken: (token: string | null) => void;
  onStateChange: (state: TurnstileLifecycleState) => void;
  responsive?: boolean;
}

const TURNSTILE_READY_EVENT = 'dcz:turnstile-ready';
const TURNSTILE_ERROR_EVENT = 'dcz:turnstile-error';
const DELAYED_STATE_MS = 8_000;
const TERMINAL_STATE_MS = 20_000;
const MAX_ERROR_CALLBACKS = 3;

const RETRYABLE_ERROR_CODES = new Set(['110600', '110620', '200500']);
const NON_RETRYABLE_ERROR_CODES = new Set([
  '110100',
  '110110',
  '110200',
  '200100',
  '400020',
  '400070',
]);

type ErrorDisposition = 'retryable' | 'non_retryable' | 'unknown';

function classifyErrorCode(code?: string): ErrorDisposition {
  const normalized = code?.trim();
  if (!normalized || !/^\d{6}$/.test(normalized)) return 'unknown';
  if (NON_RETRYABLE_ERROR_CODES.has(normalized)) return 'non_retryable';
  if (
    RETRYABLE_ERROR_CODES.has(normalized)
    || normalized.startsWith('300')
    || normalized.startsWith('600')
  ) {
    return 'retryable';
  }
  return 'unknown';
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget(
    { siteKey, action, onToken, onStateChange, responsive = false },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetRef = useRef<{ id: string; generation: number } | null>(null);
    const generationRef = useRef(0);
    const tokenCallbackRef = useRef(onToken);
    const stateCallbackRef = useRef(onStateChange);
    const mountedRef = useRef(false);
    const terminalRef = useRef(false);
    const recoveryClaimedRef = useRef(false);
    const errorCallbackCountRef = useRef(0);
    const transientActiveRef = useRef(false);
    const transientDelayedRef = useRef(false);
    const scriptDelayedTimerRef = useRef<number | null>(null);
    const scriptTerminalTimerRef = useRef<number | null>(null);
    const transientDelayedTimerRef = useRef<number | null>(null);
    const transientTerminalTimerRef = useRef<number | null>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [renderRequest, setRenderRequest] = useState(0);

    useEffect(() => {
      tokenCallbackRef.current = onToken;
    }, [onToken]);

    useEffect(() => {
      stateCallbackRef.current = onStateChange;
    }, [onStateChange]);

    const publishState = useCallback((state: TurnstileLifecycleState) => {
      if (mountedRef.current) stateCallbackRef.current(state);
    }, []);

    const clearToken = useCallback(() => {
      tokenCallbackRef.current(null);
    }, []);

    const stopScriptTimers = useCallback(() => {
      if (scriptDelayedTimerRef.current !== null) {
        window.clearTimeout(scriptDelayedTimerRef.current);
        scriptDelayedTimerRef.current = null;
      }
      if (scriptTerminalTimerRef.current !== null) {
        window.clearTimeout(scriptTerminalTimerRef.current);
        scriptTerminalTimerRef.current = null;
      }
    }, []);

    const stopTransientTimers = useCallback(() => {
      if (transientDelayedTimerRef.current !== null) {
        window.clearTimeout(transientDelayedTimerRef.current);
        transientDelayedTimerRef.current = null;
      }
      if (transientTerminalTimerRef.current !== null) {
        window.clearTimeout(transientTerminalTimerRef.current);
        transientTerminalTimerRef.current = null;
      }
      transientActiveRef.current = false;
      transientDelayedRef.current = false;
    }, []);

    const removeOwnedWidget = useCallback((expectedGeneration?: number) => {
      const owned = widgetRef.current;
      if (!owned || (expectedGeneration !== undefined && owned.generation !== expectedGeneration)) {
        return;
      }

      widgetRef.current = null;
      generationRef.current += 1;
      try {
        window.turnstile?.remove(owned.id);
      } catch {
        // The local ownership is already cleared, so a stale vendor handle is harmless.
      }
    }, []);

    const terminalize = useCallback((state: 'client_error' | 'unavailable') => {
      if (terminalRef.current) return false;
      terminalRef.current = true;
      recoveryClaimedRef.current = false;
      stopScriptTimers();
      stopTransientTimers();
      clearToken();
      publishState(state);
      removeOwnedWidget();
      return true;
    }, [
      clearToken,
      publishState,
      removeOwnedWidget,
      stopScriptTimers,
      stopTransientTimers,
    ]);

    const startScriptWindow = useCallback(() => {
      stopScriptTimers();
      publishState('script_loading');
      scriptDelayedTimerRef.current = window.setTimeout(() => {
        if (!terminalRef.current) publishState('script_delayed');
      }, DELAYED_STATE_MS);
      scriptTerminalTimerRef.current = window.setTimeout(() => {
        terminalize('unavailable');
      }, TERMINAL_STATE_MS);
    }, [publishState, stopScriptTimers, terminalize]);

    const ensureTransientWindow = useCallback((state: TurnstileLifecycleState) => {
      if (terminalRef.current) return;
      if (!transientActiveRef.current) {
        transientActiveRef.current = true;
        transientDelayedRef.current = false;
        transientDelayedTimerRef.current = window.setTimeout(() => {
          if (terminalRef.current || !transientActiveRef.current) return;
          transientDelayedRef.current = true;
          publishState('challenge_delayed');
        }, DELAYED_STATE_MS);
        transientTerminalTimerRef.current = window.setTimeout(() => {
          terminalize('client_error');
        }, TERMINAL_STATE_MS);
      }
      publishState(transientDelayedRef.current ? 'challenge_delayed' : state);
    }, [publishState, terminalize]);

    const resetGenerationState = useCallback(() => {
      stopTransientTimers();
      errorCallbackCountRef.current = 0;
      terminalRef.current = false;
      recoveryClaimedRef.current = false;
    }, [stopTransientTimers]);

    useImperativeHandle(ref, () => ({
      reset() {
        if (terminalRef.current) return;
        clearToken();
        const owned = widgetRef.current;
        if (!owned || !window.turnstile) {
          terminalize('unavailable');
          return;
        }

        resetGenerationState();
        ensureTransientWindow('widget_rendering');
        try {
          window.turnstile.reset(owned.id);
        } catch {
          terminalize('client_error');
        }
      },
      recover() {
        if (!terminalRef.current || recoveryClaimedRef.current) return 'ignored';
        recoveryClaimedRef.current = true;
        clearToken();
        if (
          window.__dczTurnstileBridge?.status !== 'ready'
          || !window.turnstile
        ) {
          publishState('script_loading');
          return 'reload_required';
        }

        resetGenerationState();
        publishState('widget_rendering');
        setScriptReady(true);
        setRenderRequest((value) => value + 1);
        return 'recovered';
      },
    }), [
      clearToken,
      ensureTransientWindow,
      publishState,
      resetGenerationState,
      terminalize,
    ]);

    useEffect(() => {
      mountedRef.current = true;
      terminalRef.current = false;
      recoveryClaimedRef.current = false;
      if (!siteKey) {
        publishState('unavailable');
        return () => {
          mountedRef.current = false;
        };
      }

      const handleReady = () => {
        if (terminalRef.current) return;
        stopScriptTimers();
        if (!window.turnstile) {
          terminalize('unavailable');
          return;
        }
        setScriptReady(true);
        publishState('script_ready');
      };
      const handleError = () => {
        terminalize('unavailable');
      };

      window.addEventListener(TURNSTILE_READY_EVENT, handleReady);
      window.addEventListener(TURNSTILE_ERROR_EVENT, handleError);

      if (
        window.__dczTurnstileBridge?.status === 'ready'
        || window.turnstile
      ) {
        handleReady();
      } else if (window.__dczTurnstileBridge?.status === 'failed') {
        handleError();
      } else {
        startScriptWindow();
      }

      return () => {
        mountedRef.current = false;
        window.removeEventListener(TURNSTILE_READY_EVENT, handleReady);
        window.removeEventListener(TURNSTILE_ERROR_EVENT, handleError);
        stopScriptTimers();
        stopTransientTimers();
        removeOwnedWidget();
      };
    }, [
      publishState,
      removeOwnedWidget,
      siteKey,
      startScriptWindow,
      stopScriptTimers,
      stopTransientTimers,
      terminalize,
    ]);

    useEffect(() => {
      if (!siteKey || !scriptReady || !containerRef.current || terminalRef.current) return;
      const turnstile = window.turnstile;
      if (!turnstile) {
        terminalize('unavailable');
        return;
      }

      removeOwnedWidget();
      resetGenerationState();
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      ensureTransientWindow('widget_rendering');

      const isCurrent = () => (
        mountedRef.current
        && !terminalRef.current
        && widgetRef.current?.generation === generation
      );

      try {
        const availableWidth = containerRef.current.getBoundingClientRect().width;
        const id = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'dark',
          ...(responsive
            ? {
                size: availableWidth > 0 && availableWidth < 300
                  ? 'compact' as const
                  : 'flexible' as const,
              }
            : {}),
          appearance: 'interaction-only',
          execution: 'render',
          retry: 'auto',
          'retry-interval': 8_000,
          'refresh-expired': 'auto',
          'refresh-timeout': 'auto',
          'response-field': false,
          callback: (token) => {
            if (!isCurrent()) return;
            stopTransientTimers();
            errorCallbackCountRef.current = 0;
            tokenCallbackRef.current(token);
            publishState('verified');
          },
          'expired-callback': () => {
            if (!isCurrent()) return;
            clearToken();
            ensureTransientWindow('refreshing');
          },
          'error-callback': (code) => {
            if (!isCurrent() || terminalRef.current) return true;
            clearToken();
            if (classifyErrorCode(code) === 'non_retryable') {
              terminalize('client_error');
              return true;
            }

            errorCallbackCountRef.current += 1;
            if (errorCallbackCountRef.current >= MAX_ERROR_CALLBACKS) {
              terminalize('client_error');
              return true;
            }
            ensureTransientWindow('retrying');
            return false;
          },
          'timeout-callback': () => {
            if (!isCurrent()) return;
            clearToken();
            ensureTransientWindow('refreshing');
          },
          'before-interactive-callback': () => {
            if (!isCurrent()) return;
            stopTransientTimers();
            publishState('widget_visible');
          },
          'after-interactive-callback': () => {
            if (isCurrent()) ensureTransientWindow('verifying');
          },
          'unsupported-callback': () => {
            if (isCurrent()) terminalize('unavailable');
          },
        });
        widgetRef.current = { id, generation };

        return () => {
          stopTransientTimers();
          removeOwnedWidget(generation);
        };
      } catch {
        terminalize('client_error');
      }
    }, [
      action,
      clearToken,
      ensureTransientWindow,
      publishState,
      removeOwnedWidget,
      renderRequest,
      resetGenerationState,
      responsive,
      scriptReady,
      siteKey,
      stopTransientTimers,
      terminalize,
    ]);

    if (!siteKey) return null;

    return (
      <div
        ref={containerRef}
        className={responsive ? 'turnstile-slot' : 'min-h-16'}
        aria-label="Bezpečnostné overenie"
      />
    );
  },
);
