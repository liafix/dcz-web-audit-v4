// @vitest-environment jsdom

import React, { createRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TurnstileWidget,
  type TurnstileLifecycleState,
  type TurnstileWidgetHandle,
} from '@/components/forms/turnstile-widget';

function installTurnstile({ appendIframe = true }: { appendIframe?: boolean } = {}) {
  type RenderOptions = Parameters<NonNullable<Window['turnstile']>['render']>[1];
  let nextId = 0;
  const options = new Map<string, RenderOptions>();
  const containers = new Map<string, HTMLElement>();
  const renderMock = vi.fn((container: HTMLElement, renderOptions: RenderOptions) => {
    nextId += 1;
    const id = `widget-${nextId}`;
    if (appendIframe) {
      const iframe = document.createElement('iframe');
      iframe.dataset.widgetId = id;
      container.appendChild(iframe);
    }
    options.set(id, renderOptions);
    containers.set(id, container);
    return id;
  });
  const removeMock = vi.fn((id: string) => {
    containers.get(id)?.querySelector(`[data-widget-id="${id}"]`)?.remove();
    containers.delete(id);
  });
  const resetMock = vi.fn();
  window.turnstile = { render: renderMock, remove: removeMock, reset: resetMock };
  return { renderMock, removeMock, resetMock, options };
}

function bridge(status: 'loading' | 'ready' | 'failed') {
  window.__dczTurnstileBridge = { status };
}

describe('TurnstileWidget bounded lifecycle ownership', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    bridge('ready');
  });

  afterEach(() => {
    cleanup();
    delete window.turnstile;
    delete window.__dczTurnstileBridge;
    delete window.__dczTurnstileReady;
    vi.useRealTimers();
  });

  it('waits for the readiness bridge and does not use iframe presence as failure proof', async () => {
    bridge('loading');
    const states: TurnstileLifecycleState[] = [];
    render(
      <TurnstileWidget
        siteKey="site-key"
        action="audit_start"
        onToken={() => undefined}
        onStateChange={(state) => states.push(state)}
      />,
    );

    expect(states).toContain('script_loading');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_501);
    });
    expect(states).not.toContain('client_error');

    const api = installTurnstile({ appendIframe: false });
    bridge('ready');
    window.dispatchEvent(new Event('dcz:turnstile-ready'));
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_501);
    });
    expect(states).not.toContain('client_error');
  });

  it('renders immediately after readiness and owns one widget across parent rerenders', async () => {
    const api = installTurnstile();
    const tokens: Array<string | null> = [];
    const states: TurnstileLifecycleState[] = [];

    function Harness() {
      const [, rerenderParent] = useState(0);
      return (
        <>
          <button type="button" onClick={() => rerenderParent((value) => value + 1)}>
            parent rerender
          </button>
          <TurnstileWidget
            siteKey="site-key"
            action="audit_start"
            onToken={(token) => tokens.push(token)}
            onStateChange={(state) => states.push(state)}
          />
        </>
      );
    }

    const view = render(<Harness />);
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));
    const firstOptions = api.options.get('widget-1')!;
    expect(firstOptions).toEqual(expect.objectContaining({
      sitekey: 'site-key',
      action: 'audit_start',
      appearance: 'interaction-only',
      execution: 'render',
      retry: 'auto',
      'refresh-expired': 'auto',
      'refresh-timeout': 'auto',
      'response-field': false,
    }));

    fireEvent.click(screen.getByText('parent rerender'));
    expect(api.renderMock).toHaveBeenCalledTimes(1);
    expect(api.removeMock).not.toHaveBeenCalled();

    firstOptions.callback('one-use-token');
    expect(tokens).toEqual(['one-use-token']);
    expect(states).toContain('verified');

    view.unmount();
    expect(api.removeMock).toHaveBeenCalledTimes(1);
    firstOptions.callback('stale-token');
    expect(tokens).toEqual(['one-use-token']);
  });

  it('shows delayed script feedback and terminalizes script loading by twenty seconds', async () => {
    bridge('loading');
    const states: TurnstileLifecycleState[] = [];
    const widgetHandle = createRef<TurnstileWidgetHandle>();
    render(
      <TurnstileWidget
        ref={widgetHandle}
        siteKey="site-key"
        action="audit_start"
        onToken={() => undefined}
        onStateChange={(state) => states.push(state)}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });
    expect(states.at(-1)).toBe('script_delayed');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(states.at(-1)).toBe('unavailable');
    expect(widgetHandle.current?.recover()).toBe('reload_required');
    expect(states.at(-1)).toBe('script_loading');
    expect(widgetHandle.current?.recover()).toBe('ignored');
  });

  it('observes an explicit singleton script resource failure', () => {
    bridge('loading');
    const states: TurnstileLifecycleState[] = [];
    render(
      <TurnstileWidget
        siteKey="site-key"
        action="audit_start"
        onToken={() => undefined}
        onStateChange={(state) => states.push(state)}
      />,
    );

    bridge('failed');
    window.dispatchEvent(new Event('dcz:turnstile-error'));
    expect(states.at(-1)).toBe('unavailable');
  });

  it('returns false for two retryable callbacks, then terminalizes and returns true', async () => {
    const api = installTurnstile();
    const states: TurnstileLifecycleState[] = [];
    const tokens: Array<string | null> = [];
    render(
      <TurnstileWidget
        siteKey="site-key"
        action="audit_start"
        onToken={(token) => tokens.push(token)}
        onStateChange={(state) => states.push(state)}
      />,
    );
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));
    const options = api.options.get('widget-1')!;

    expect(options['error-callback']('110600')).toBe(false);
    expect(options['error-callback']('300030')).toBe(false);
    expect(states.at(-1)).toBe('retrying');
    expect(api.resetMock).not.toHaveBeenCalled();
    expect(api.removeMock).not.toHaveBeenCalled();
    expect(api.renderMock).toHaveBeenCalledTimes(1);

    expect(options['error-callback']('600010')).toBe(true);
    expect(states.at(-1)).toBe('client_error');
    expect(api.removeMock).toHaveBeenCalledTimes(1);

    expect(options['error-callback']('110600')).toBe(true);
    expect(api.removeMock).toHaveBeenCalledTimes(1);
    expect(states.filter((state) => state === 'client_error')).toHaveLength(1);
    expect(tokens.every((token) => token === null)).toBe(true);
  });

  it('terminalizes known non-retryable errors immediately', async () => {
    const api = installTurnstile();
    const states: TurnstileLifecycleState[] = [];
    render(
      <TurnstileWidget
        siteKey="site-key"
        action="audit_start"
        onToken={() => undefined}
        onStateChange={(state) => states.push(state)}
      />,
    );
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));

    expect(api.options.get('widget-1')!['error-callback']('110200')).toBe(true);
    expect(states.at(-1)).toBe('client_error');
    expect(api.removeMock).toHaveBeenCalledTimes(1);
  });

  it('bounds an unknown error by the non-extending twenty-second window', async () => {
    const api = installTurnstile();
    const states: TurnstileLifecycleState[] = [];
    render(
      <TurnstileWidget
        siteKey="site-key"
        action="audit_start"
        onToken={() => undefined}
        onStateChange={(state) => states.push(state)}
      />,
    );
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));

    expect(api.options.get('widget-1')!['error-callback']('malformed')).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });
    expect(states.at(-1)).toBe('challenge_delayed');

    api.options.get('widget-1')!['timeout-callback']();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
    expect(states.at(-1)).toBe('client_error');
    expect(api.removeMock).toHaveBeenCalledTimes(1);
  });

  it('bounds refresh and verification without exposing competing recovery', async () => {
    const api = installTurnstile();
    const states: TurnstileLifecycleState[] = [];
    render(
      <TurnstileWidget
        siteKey="site-key"
        action="audit_start"
        onToken={() => undefined}
        onStateChange={(state) => states.push(state)}
      />,
    );
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));
    const options = api.options.get('widget-1')!;

    options.callback('token');
    options['expired-callback']();
    expect(states.at(-1)).toBe('refreshing');
    expect(api.resetMock).not.toHaveBeenCalled();

    options['before-interactive-callback']();
    expect(states.at(-1)).toBe('widget_visible');
    options['after-interactive-callback']();
    expect(states.at(-1)).toBe('verifying');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(states.at(-1)).toBe('client_error');
    expect(api.removeMock).toHaveBeenCalledTimes(1);
  });

  it('ignores stale callbacks and allows exactly one terminal recovery generation', async () => {
    const api = installTurnstile();
    const tokens: Array<string | null> = [];
    const widgetHandle = createRef<TurnstileWidgetHandle>();
    render(
      <TurnstileWidget
        ref={widgetHandle}
        siteKey="site-key"
        action="audit_start"
        onToken={(token) => tokens.push(token)}
        onStateChange={() => undefined}
      />,
    );
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));
    const staleOptions = api.options.get('widget-1')!;
    expect(staleOptions['error-callback']('400070')).toBe(true);

    expect(widgetHandle.current?.recover()).toBe('recovered');
    expect(widgetHandle.current?.recover()).toBe('ignored');
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(2));
    staleOptions.callback('stale-token');
    expect(tokens).not.toContain('stale-token');

    api.options.get('widget-2')!.callback('current-token');
    expect(tokens).toContain('current-token');
    expect(api.removeMock).toHaveBeenCalledTimes(1);
  });
});
