import { NextResponse } from 'next/server';
import { STAGE_LABELS } from '@/lib/audit/status';
import { findAuditByToken } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_ATTEMPTS = 3;
const STALE_MS = 70_000;

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const audit = await findAuditByToken(token);
  if (!audit) return NextResponse.json({ error: 'Audit neexistuje.' }, { status: 404 });

  const expired = audit.expiresAt <= new Date() || audit.status === 'expired';
  const status = expired ? 'expired' : audit.status;
  const ready = status === 'ready';
  const failed = status === 'failed';
  const active = !ready && !failed && status !== 'expired';
  const heartbeat = audit.lastHeartbeatAt ?? audit.startedAt ?? audit.createdAt;
  const leaseExpired = !audit.processingLeaseUntil || audit.processingLeaseUntil <= new Date();
  const ageMs = Date.now() - heartbeat.getTime();
  const stale = active && leaseExpired && ageMs > STALE_MS;
  const retryable = (stale || failed) && audit.attemptCount < MAX_ATTEMPTS;

  return NextResponse.json(
    {
      status,
      currentStage: audit.currentStage,
      stageLabel: STAGE_LABELS[audit.currentStage] ?? 'Audit čaká na spracovanie',
      ready,
      failed,
      stale,
      retryable,
      attemptCount: audit.attemptCount,
      maxAttempts: MAX_ATTEMPTS,
      lastHeartbeatAt: heartbeat.toISOString(),
      retryAfterMs: stale ? 0 : Math.max(0, STALE_MS - ageMs),
      message: audit.failureMessage,
      errorId: audit.failureErrorId,
      resultUrl: ready ? `/audit/${encodeURIComponent(token)}/result` : null,
    },
    { headers: { 'cache-control': 'no-store, private' } },
  );
}
