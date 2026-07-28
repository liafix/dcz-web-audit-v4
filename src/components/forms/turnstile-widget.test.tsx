// @vitest-environment jsdom

import React, { createRef, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TurnstileWidget,
  type TurnstileLifecycleState,
  type TurnstileWidgetHandle,
} from '@/components/forms/turnstile-widget';

const scriptCallbacks = vi.hoisted(() => ({
  ready: null as null | (() => void),
  error: null as null | (() => void),
}));

vi.mock('next/script', () => ({
  default: (props: { onReady?: () => void; onError?: () => void }) => {
    scriptCallbacks.ready = props.onReady ?? null;
    scriptCallbacks.error = props.onError ?? null;
    return <div data-testid="turnstile-script" />;
  },
}));

function installTurnstile() {
  type RenderOptions = Parameters<NonNullable<Window['turnstile']>['render']>[1];
  let nextId = 0;
  const options = new Map<string, RenderOptions>();
  const containers = new Map<string, HTMLElement>();
  const renderMock = vi.fn((container: HTMLElement, renderOptions: RenderOptions) => {
    nextId += 1;
    const id = `widget-${nextId}`;
    const iframe = document.createElement('iframe');
    iframe.dataset.widgetId = id;
    container.appendChild(iframe);
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

describe('TurnstileWidget lifecycle ownership', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    scriptCallbacks.ready = null;
    scriptCallbacks.error = null;
  });

  afterEach(() => {
    cleanup();
    delete window.turnstile;
    vi.useRealTimers();
  });

  it('owns one widget across parent rerenders and ignores stale callbacks after cleanup', async () => {
    const api = installTurnstile();
    const tokens: Array<string | null> = [];
    const states: TurnstileLifecycleState[] = [];

    function Harness() {
      const [, rerenderParent] = useState(0);
      return (
        <>
          <button type="button" onClick={() => rerenderParent((value) => value + 1)}>parent rerender</button>
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
      'refresh-expired': 'auto',
      'refresh-timeout': 'auto',
      'response-field': false,
    }));

    fireEvent.click(screen.getByText('parent rerender'));
    expect(api.renderMock).toHaveBeenCalledTimes(1);
    expect(api.removeMock).not.toHaveBeenCalled();

    (firstOptions.callback as (token: string) => void)('one-use-token');
    expect(tokens).toEqual(['one-use-token']);
    expect(states).toContain('verified');

    view.unmount();
    expect(api.removeMock).toHaveBeenCalledTimes(1);
    (firstOptions.callback as (token: string) => void)('stale-token');
    expect(tokens).toEqual(['one-use-token']);
  });

  it('uses onReady/onError and recovers from a reset failure by re-rendering', async () => {
    const states: TurnstileLifecycleState[] = [];
    const tokens: Array<string | null> = [];
    const widgetHandle = createRef<TurnstileWidgetHandle>();
    render(
      <TurnstileWidget
        ref={widgetHandle}
        siteKey="site-key"
        action="audit_resend"
        onToken={(token) => tokens.push(token)}
        onStateChange={(state) => states.push(state)}
      />,
    );

    expect(states).toContain('script_loading');
    scriptCallbacks.error?.();
    expect(states).toContain('unavailable');

    const api = installTurnstile();
    scriptCallbacks.ready?.();
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(1));
    api.resetMock.mockImplementationOnce(() => {
      throw new Error('stale widget id');
    });

    widgetHandle.current?.reset();
    await waitFor(() => expect(api.renderMock).toHaveBeenCalledTimes(2));
    expect(api.removeMock).toHaveBeenCalledWith('widget-1');
    expect(states).toContain('rerendering');
    expect(tokens.at(-1)).toBeNull();
  });
});
