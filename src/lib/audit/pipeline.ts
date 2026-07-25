import 'server-only';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { collectPageSpeed } from '@/lib/audit/pagespeed';
import { extractHtmlSignals } from '@/lib/audit/extract-html';
import { buildAuditReport } from '@/lib/audit/report';
import { inspectTechnicalFiles } from '@/lib/audit/technical-files';
import type { AuditEvidence } from '@/lib/audit/types';
import { claimAudit, completeAudit, failAudit, findAuditById, updateAuditStage } from '@/lib/db/queries';
import { safeAuditFailure } from '@/lib/errors/public-error';
import { correlationId, logApplicationEvent } from '@/lib/monitoring/logger';
import { safeFetchText } from '@/lib/security/safe-fetch';
import { upsertBusinessProfile } from '@/lib/db/revenue-queries';

const MAX_ATTEMPTS = 3;
const AUDIT_BUDGET_MS = 50_000;

function remaining(deadlineAt: number, minimum = 250): number {
  const value = deadlineAt - Date.now();
  if (value < minimum) throw new Error('Audit prekročil celkový časový deadline.');
  return value;
}

export async function processAudit(auditId: string): Promise<'completed' | 'already_processing'> {
  const claimed = await claimAudit(auditId, MAX_ATTEMPTS);
  if (!claimed) return 'already_processing';
  const deadlineAt = Date.now() + AUDIT_BUDGET_MS;
  const audit = await findAuditById(auditId);
  if (!audit) throw new Error('Audit record does not exist.');

  try {
    await recordFunnelEventSafe({
      auditId,
      event: 'audit_processing_started',
      metadata: { attempt: audit.attemptCount },
    });

    await updateAuditStage(auditId, 'fetching_homepage');
    const homepage = await safeFetchText(audit.normalizedUrl, {
      maxRedirects: 3,
      timeoutMs: Math.min(12_000, remaining(deadlineAt)),
      maxBytes: 1_000_000,
      deadlineAt,
    });

    await updateAuditStage(auditId, 'checking_technical_files');
    const technicalFiles = await inspectTechnicalFiles(new URL(homepage.finalUrl).origin, deadlineAt);

    await updateAuditStage(auditId, 'pagespeed');
    const pageSpeedBudget = Math.max(0, deadlineAt - Date.now());
    const pageSpeed = pageSpeedBudget > 2_000
      ? await collectPageSpeed(homepage.finalUrl, Math.min(10_000, pageSpeedBudget), deadlineAt)
      : {
          available: false,
          performance: null,
          accessibility: null,
          bestPractices: null,
          seo: null,
          fetchedAt: null,
          reason: 'insufficient_time_budget',
        };

    await updateAuditStage(auditId, 'extracting');
    const html = extractHtmlSignals(homepage.body, homepage.finalUrl);
    const evidence: AuditEvidence = {
      sourceUrl: audit.normalizedUrl,
      finalUrl: homepage.finalUrl,
      httpStatus: homepage.status,
      contentType: homepage.contentType,
      bodyBytes: homepage.bodyBytes,
      durationMs: homepage.durationMs,
      responseHeaders: homepage.responseHeaders,
      fetchedAt: new Date().toISOString(),
      html,
      technicalFiles,
      pageSpeed,
    };

    remaining(deadlineAt, 500);
    await updateAuditStage(auditId, 'scoring');
    const report = buildAuditReport(audit.targetUrl, evidence);
    await updateAuditStage(auditId, 'assembling_report');
    await completeAudit(auditId, evidence, report);
    try {
      await upsertBusinessProfile(auditId, report.businessProfile);
    } catch (profileError) {
      await logApplicationEvent({ level: 'warn', event: 'business_profile_store_failed', auditId, error: profileError });
    }
    await recordFunnelEventSafe({
      auditId,
      event: 'audit_completed',
      metadata: {
        score: report.overallScore,
        confidence: report.confidence,
        coverage: report.overallCoverage,
        version: report.version,
        processingMs: AUDIT_BUDGET_MS - Math.max(0, deadlineAt - Date.now()),
      },
    });
    return 'completed';
  } catch (error) {
    const failure = safeAuditFailure(error);
    const errorId = correlationId('AUD');
    await logApplicationEvent({
      level: 'error',
      event: failure.code,
      errorId,
      auditId,
      error,
    });
    await failAudit(auditId, failure.code, failure.publicMessage, errorId);
    await recordFunnelEventSafe({
      auditId,
      event: 'audit_failed',
      metadata: { code: failure.code, errorId },
    });
    throw error;
  }
}
