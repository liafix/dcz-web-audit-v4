// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressClient } from '@/components/audit/progress-client';

const router = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

describe('ProgressClient processing reliability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('handles a rejected processing trigger without an unhandled promise or false reload', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/process')) return Promise.reject(new TypeError('offline'));
      return Promise.resolve(new Response(JSON.stringify({
        status: 'failed',
        currentStage: 'fetching_homepage',
        stageLabel: 'Spracovanie sa zastavilo',
        ready: false,
        failed: true,
        stale: false,
        retryable: false,
        attemptCount: 3,
        maxAttempts: 3,
        lastHeartbeatAt: null,
        retryAfterMs: 0,
        message: 'Audit sa nepodarilo dokončiť.',
        errorId: 'ERR-MOCK',
        resultUrl: null,
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProgressClient token="audit_mock-token" initialStatus="created" />);

    await waitFor(() => {
      expect(screen.getByText(/Spracovanie sa nepodarilo spustiť/)).toBeTruthy();
    });
    expect(screen.getByText('Audit sa nepodarilo dokončiť')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
