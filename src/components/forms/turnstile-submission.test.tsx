// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditForm } from '@/components/forms/audit-form';
import { UnlockForm } from '@/components/forms/unlock-form';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  widgetReset: vi.fn(),
  requestFetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/components/forms/turnstile-widget', async () => {
  const React = await import('react');
  interface WidgetProps {
    onToken: (token: string | null) => void;
    onStateChange: (state: string) => void;
  }
  return {
    TurnstileWidget: React.forwardRef(function MockTurnstileWidget(
      props: WidgetProps,
      ref: React.ForwardedRef<{ reset: () => void; recover: () => void }>,
    ) {
      const { onStateChange, onToken } = props;
      React.useEffect(() => {
        onStateChange('widget_rendering');
      }, [onStateChange]);
      React.useImperativeHandle(ref, () => ({
        reset: () => {
          mocks.widgetReset();
          onToken(null);
          onStateChange('widget_rendering');
        },
        recover: () => onStateChange('widget_rendering'),
      }));
      return (
        <div data-testid="turnstile-widget">
          <button type="button" onClick={() => {
            onToken('fresh-client-token');
            onStateChange('verified');
          }}>complete challenge</button>
          <button type="button" onClick={() => {
            onToken(null);
            onStateChange('expired');
          }}>expire challenge</button>
          <button type="button" onClick={() => {
            onToken(null);
            onStateChange('client_error');
          }}>error challenge</button>
          <button type="button" onClick={() => {
            onToken(null);
            onStateChange('timed_out');
          }}>timeout challenge</button>
        </div>
      );
    }),
  };
});

function auditForm(): HTMLFormElement {
  const input = screen.getByLabelText('URL webstránky');
  return input.closest('form')!;
}

async function resolveDeferred(
  resolve: (response: Response) => void,
  response: Response,
): Promise<void> {
  await act(async () => {
    resolve(response);
    await Promise.resolve();
  });
}

describe('one-attempt Turnstile client lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key');
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (input === '/api/events/landing') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }));
      }
      return mocks.requestFetch(input, init);
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([422, 429, 500])(
    'captures one token, dispatches once, and resets after HTTP %s',
    async (status) => {
      let resolve!: (response: Response) => void;
      const fetchMock = mocks.requestFetch;
      fetchMock.mockReturnValueOnce(new Promise<Response>((done) => { resolve = done; }));
      render(<AuditForm />);
      fireEvent.change(screen.getByLabelText('URL webstránky'), {
        target: { value: 'https://example.test' },
      });
      fireEvent.click(screen.getByText('complete challenge'));

      fireEvent.submit(auditForm());
      fireEvent.submit(auditForm());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
        turnstileToken: string;
      };
      expect(body.turnstileToken).toBe('fresh-client-token');

      await resolveDeferred(resolve, new Response(JSON.stringify({
        error: 'Request failed.',
        errorId: 'ERR-TEST',
      }), { status, headers: { 'content-type': 'application/json' } }));
      await screen.findByRole('alert');
      expect(mocks.widgetReset).toHaveBeenCalledTimes(1);

      fireEvent.submit(auditForm());
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('alert').textContent).toContain('Počkajte');
    },
  );

  it('resets and releases the lock after network and ambiguous JSON failures', async () => {
    const fetchMock = mocks.requestFetch;
    fetchMock
      .mockRejectedValueOnce(new TypeError('network unavailable'))
      .mockResolvedValueOnce(new Response('not-json', { status: 200 }));
    render(<AuditForm />);
    fireEvent.change(screen.getByLabelText('URL webstránky'), {
      target: { value: 'https://example.test' },
    });

    fireEvent.click(screen.getByText('complete challenge'));
    fireEvent.submit(auditForm());
    await waitFor(() => expect(mocks.widgetReset).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('complete challenge'));
    fireEvent.submit(auditForm());
    await waitFor(() => expect(mocks.widgetReset).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('navigates at most once after duplicate submit events', async () => {
    const fetchMock = mocks.requestFetch;
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      token: 'audit_new-token',
    }), { status: 201, headers: { 'content-type': 'application/json' } }));
    render(<AuditForm />);
    fireEvent.change(screen.getByLabelText('URL webstránky'), {
      target: { value: 'https://example.test' },
    });
    fireEvent.click(screen.getByText('complete challenge'));

    fireEvent.submit(auditForm());
    fireEvent.submit(auditForm());

    await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.widgetReset).not.toHaveBeenCalled();
  });

  it.each([
    ['expire challenge', 'vypršala'],
    ['error challenge', 'nepodarilo načítať'],
    ['timeout challenge', 'nečinnosť'],
  ])('handles the %s callback and requires a new token', (callback, message) => {
    const fetchMock = mocks.requestFetch;
    render(<AuditForm />);
    fireEvent.change(screen.getByLabelText('URL webstránky'), {
      target: { value: 'https://example.test' },
    });
    fireEvent.click(screen.getByText('complete challenge'));
    fireEvent.click(screen.getByText(callback));
    expect(screen.getByRole('alert').textContent).toContain(message);
    fireEvent.submit(auditForm());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').some((node) => node.textContent?.includes('Obnovte'))).toBe(true);
  });

  it('renders fallback after between-render-and-submit expiry without losing contact fields', async () => {
    const fetchMock = mocks.requestFetch;
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: 'Platnosť bezpečnostného overenia vypršala.',
        code: 'verification_required',
        errorId: 'ERR-EXPIRED',
      }), { status: 428, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        checkEmailUrl: '/audit/audit_public-token/check-email',
        emailSent: true,
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    render(<UnlockForm token="audit_public-token" funnelVerified />);
    expect(screen.queryByTestId('turnstile-widget')).toBeNull();
    const email = screen.getByLabelText(/E-mail, na ktorý/);
    const name = screen.getByLabelText('Meno');
    fireEvent.change(email, { target: { value: 'owner@example.test' } });
    fireEvent.change(name, { target: { value: 'Owner Name' } });
    fireEvent.submit(email.closest('form')!);

    await screen.findByTestId('turnstile-widget');
    expect(screen.getByRole('alert').textContent).toContain('vypršala');
    expect((email as HTMLInputElement).value).toBe('owner@example.test');
    expect((name as HTMLInputElement).value).toBe('Owner Name');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('complete challenge'));
    fireEvent.submit(email.closest('form')!);
    await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as {
      turnstileToken: string;
    };
    expect(secondBody.turnstileToken).toBe('fresh-client-token');
  });
});
