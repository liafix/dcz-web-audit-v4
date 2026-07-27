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

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'dark' | 'light' | 'auto';
          size?: 'compact' | 'flexible' | 'normal';
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          'timeout-callback': () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, {
  siteKey?: string;
  onToken: (token: string | null) => void;
  responsive?: boolean;
  onExpired?: () => void;
  onError?: () => void;
  onTimeout?: () => void;
}>(function TurnstileWidget({
  siteKey,
  onToken,
  responsive = false,
  onExpired,
  onError,
  onTimeout,
}, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const renderWidget = useCallback(() => {
    if (!siteKey || !loaded || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) window.turnstile.remove(widgetIdRef.current);
    const availableWidth = containerRef.current.getBoundingClientRect().width;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'dark',
      ...(responsive
        ? { size: availableWidth > 0 && availableWidth < 300 ? 'compact' as const : 'flexible' as const }
        : {}),
      callback: (token) => onToken(token),
      'expired-callback': () => {
        onToken(null);
        onExpired?.();
      },
      'error-callback': () => {
        onToken(null);
        onError?.();
      },
      'timeout-callback': () => {
        onToken(null);
        onTimeout?.();
      },
    });
  }, [loaded, onError, onExpired, onTimeout, onToken, responsive, siteKey]);

  useImperativeHandle(ref, () => ({
    reset() {
      onToken(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }), [onToken]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [renderWidget]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div ref={containerRef} className={responsive ? 'turnstile-slot' : 'min-h-16'} aria-label="Bezpečnostné overenie" />
    </>
  );
});
