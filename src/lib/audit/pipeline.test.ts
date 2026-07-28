import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  recordFunnelEventSafe: vi.fn(),
  collectPageSpeed: vi.fn(),
  extractHtmlSignals: vi.fn(),
  buildAuditReport: vi.fn(),
  inspectTechnicalFiles: vi.fn(),
  claimAudit: vi.fn(),
  completeAudit: vi.fn(),
  failAudit: vi.fn(),
  findAuditById: vi.fn(),
  updateAuditStage: vi.fn(),
  correlationId: vi.fn(),
  logApplicationEvent: vi.fn(),
  safeFetchText: vi.fn(),
  upsertBusinessProfile: vi.fn(),
}));

vi.mock('@/lib/analytics/funnel', () => ({
  recordFunnelEventSafe: mocks.recordFunnelEventSafe,
}));
vi.mock('@/lib/audit/pagespeed', () => ({
  collectPageSpeed: mocks.collectPageSpeed,
}));
vi.mock('@/lib/audit/extract-html', () => ({
  extractHtmlSignals: mocks.extractHtmlSignals,
}));
vi.mock('@/lib/audit/report', () => ({
  buildAuditReport: mocks.buildAuditReport,
}));
vi.mock('@/lib/audit/technical-files', () => ({
  inspectTechnicalFiles: mocks.inspectTechnicalFiles,
}));
vi.mock('@/lib/db/queries', () => ({
  claimAudit: mocks.claimAudit,
  completeAudit: mocks.completeAudit,
  failAudit: mocks.failAudit,
  findAuditById: mocks.findAuditById,
  updateAuditStage: mocks.updateAuditStage,
}));
vi.mock('@/lib/monitoring/logger', () => ({
  correlationId: mocks.correlationId,
  logApplicationEvent: mocks.logApplicationEvent,
}));
vi.mock('@/lib/security/safe-fetch', () => ({
  safeFetchText: mocks.safeFetchText,
}));
vi.mock('@/lib/db/revenue-queries', () => ({
  upsertBusinessProfile: mocks.upsertBusinessProfile,
}));

import { processAudit } from '@/lib/audit/pipeline';
import {
  TARGET_CONNECTION_TIMEOUT_PUBLIC_MESSAGE,
} from '@/lib/errors/public-error';
import { TargetFetchError } from '@/lib/errors/target-fetch-error';

describe('audit target-fetch failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claimAudit.mockResolvedValue(true);
    mocks.findAuditById.mockResolvedValue({
      id: 'audit-id',
      normalizedUrl: 'https://target.example/',
      targetUrl: 'https://target.example/',
      attemptCount: 2,
    });
    mocks.recordFunnelEventSafe.mockResolvedValue(undefined);
    mocks.updateAuditStage.mockResolvedValue(undefined);
    mocks.failAudit.mockResolvedValue(undefined);
    mocks.logApplicationEvent.mockResolvedValue(undefined);
    mocks.correlationId.mockReturnValue('AUD-SAFE1234');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves the three-attempt and 50-second limits while persisting sanitized diagnostics', async () => {
    const now = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const error = new TargetFetchError({
      classification: 'connection_timeout',
      phase: 'connect',
      safeCauseCode: 'UND_ERR_CONNECT_TIMEOUT',
      retryable: true,
      addressFamily: 4,
      addressAttempt: 1,
      totalAddressAttempts: 1,
    });
    mocks.safeFetchText.mockRejectedValue(error);

    await expect(processAudit('audit-id')).rejects.toBe(error);

    expect(mocks.claimAudit).toHaveBeenCalledWith('audit-id', 3);
    expect(mocks.safeFetchText).toHaveBeenCalledWith('https://target.example/', {
      maxRedirects: 3,
      timeoutMs: 12_000,
      maxBytes: 1_000_000,
      deadlineAt: now + 50_000,
    });
    expect(mocks.logApplicationEvent).toHaveBeenCalledWith({
      level: 'error',
      event: 'connection_timeout',
      errorId: 'AUD-SAFE1234',
      auditId: 'audit-id',
      targetFetch: {
        classification: 'connection_timeout',
        phase: 'connect',
        safeCauseCode: 'UND_ERR_CONNECT_TIMEOUT',
        retryable: true,
        addressFamily: 4,
        addressAttempt: 1,
        totalAddressAttempts: 1,
        auditProcessingAttempt: 2,
      },
    });
    expect(mocks.failAudit).toHaveBeenCalledWith(
      'audit-id',
      'connection_timeout',
      TARGET_CONNECTION_TIMEOUT_PUBLIC_MESSAGE,
      'AUD-SAFE1234',
    );
  });
});
