import { NextResponse } from 'next/server';
import { claimDueFollowUpJobs, markFollowUpJob } from '@/lib/db/revenue-queries';
import { processFollowUpJob } from '@/lib/follow-up/processor';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  const jobs = await claimDueFollowUpJobs(20);
  const summary = { processed: jobs.length, sent: 0, cancelled: 0, failed: 0 };
  for (const job of jobs) {
    try {
      const status = await processFollowUpJob(job);
      summary[status] += 1;
    } catch (error) {
      await markFollowUpJob({
        id: job.id,
        status: job.attemptCount >= 3 ? 'failed' : 'scheduled',
        error: error instanceof Error ? error.message : 'follow_up_processing_failed',
        retryAt: job.attemptCount >= 3 ? null : new Date(Date.now() + job.attemptCount * 30 * 60 * 1000),
      });
      summary.failed += 1;
    }
  }
  return NextResponse.json(summary, { headers: { 'cache-control': 'no-store' } });
}
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
