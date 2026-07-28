'use client';

import Script from 'next/script';
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
  | 'script_ready'
  | 'widget_rendering'
  | 'widget_visible'
  | 'verifying'
  | 'verified'
  | 'expired'
  | 'timed_out'
  | 'client_error'
  | 'unavailable'
  | 'resetting'
  | 'rerendering';

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
  'error-callback': (code?: string) => void;
  'timeout-callback': () => void;
  'before-interactive-callback': () => void;
  'after-interactive-callback': () => void;
  'unsupported-callback': () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
  recover: () => void;
}

interface TurnstileWidgetProps {
  siteKey?: string;
  action: string;
  onToken: (token: string | null) => void;
  onStateChange: (state: TurnstileLifecycleState) => void;
  responsive?: boolean;
}

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_READY_TIMEOUT_MS = 12_000;
const WIDGET_PRESENCE_TIMEOUT_MS = 1_500;

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
    const [scriptReady, setScriptReady] = useState(false);
    const [scriptAttempt, setScriptAttempt] = useState(0);
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
        // A stale Cloudflare handle is already detached. The local ownership is cleared first.
      }
    }, []);

    const requestRerender = useCallback((state: 'resetting' | 'rerendering') => {
      clearToken();
      publishState(state);
      removeOwnedWidget();
      if (window.turnstile) {
        setScriptReady(true);
        setRenderRequest((value) => value + 1);
        return;
      }

      setScriptReady(false);
      setScriptAttempt((value) => value + 1);
      publishState('script_loading');
    }, [clearToken, publishState, removeOwnedWidget]);

    useImperativeHandle(ref, () => ({
      reset() {
        clearToken();
        const owned = widgetRef.current;
        if (!owned || !window.turnstile) {
          requestRerender('resetting');
          return;
        }

        publishState('resetting');
        try {
          window.turnstile.reset(owned.id);
          publishState('widget_rendering');
        } catch {
          requestRerender('rerendering');
        }
      },
      recover() {
        requestRerender('rerendering');
      },
    }), [clearToken, publishState, requestRerender]);

    useEffect(() => {
      mountedRef.current = true;
      if (!siteKey) {
        publishState('unavailable');
        return () => {
          mountedRef.current = false;
        };
      }

      if (window.turnstile) {
        setScriptReady(true);
        publishState('script_ready');
      } else {
        publishState('script_loading');
      }

      return () => {
        mountedRef.current = false;
        removeOwnedWidget();
      };
    }, [publishState, removeOwnedWidget, siteKey]);

    useEffect(() => {
      if (!siteKey || scriptReady || window.turnstile) return;

      const timeoutId = window.setTimeout(() => {
        if (!window.turnstile) publishState('unavailable');
      }, SCRIPT_READY_TIMEOUT_MS);
      return () => window.clearTimeout(timeoutId);
    }, [publishState, scriptAttempt, scriptReady, siteKey]);

    useEffect(() => {
      if (!siteKey || !scriptReady || !containerRef.current) return;
      const turnstile = window.turnstile;
      if (!turnstile) {
        publishState('unavailable');
        return;
      }

      removeOwnedWidget();
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      publishState(renderRequest > 0 ? 'rerendering' : 'widget_rendering');

      const isCurrent = () => (
        mountedRef.current
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
            tokenCallbackRef.current(token);
            publishState('verified');
          },
          'expired-callback': () => {
            if (!isCurrent()) return;
            clearToken();
            publishState('expired');
          },
          'error-callback': () => {
            if (!isCurrent()) return;
            clearToken();
            publishState('client_error');
          },
          'timeout-callback': () => {
            if (!isCurrent()) return;
            clearToken();
            publishState('timed_out');
          },
          'before-interactive-callback': () => {
            if (isCurrent()) publishState('widget_visible');
          },
          'after-interactive-callback': () => {
            if (isCurrent()) publishState('verifying');
          },
          'unsupported-callback': () => {
            if (!isCurrent()) return;
            clearToken();
            publishState('unavailable');
          },
        });
        widgetRef.current = { id, generation };

        const presenceTimeout = window.setTimeout(() => {
          if (!isCurrent() || containerRef.current?.querySelector('iframe')) return;
          clearToken();
          publishState('client_error');
        }, WIDGET_PRESENCE_TIMEOUT_MS);

        return () => {
          window.clearTimeout(presenceTimeout);
          removeOwnedWidget(generation);
        };
      } catch {
        if (generationRef.current === generation) {
          clearToken();
          publishState('client_error');
        }
      }
    }, [
      action,
      clearToken,
      publishState,
      removeOwnedWidget,
      renderRequest,
      responsive,
      scriptReady,
      siteKey,
    ]);

    if (!siteKey) return null;

    return (
      <>
        <Script
          key={scriptAttempt}
          id={scriptAttempt === 0 ? SCRIPT_ID : `${SCRIPT_ID}-${scriptAttempt}`}
          src={scriptAttempt === 0 ? SCRIPT_URL : `${SCRIPT_URL}&retry=${scriptAttempt}`}
          strategy="afterInteractive"
          onReady={() => {
            if (!window.turnstile) {
              publishState('unavailable');
              return;
            }
            setScriptReady(true);
            publishState('script_ready');
          }}
          onError={() => {
            setScriptReady(false);
            clearToken();
            publishState('unavailable');
          }}
        />
        <div
          ref={containerRef}
          className={responsive ? 'turnstile-slot' : 'min-h-16'}
          aria-label="Bezpečnostné overenie"
        />
      </>
    );
  },
);
