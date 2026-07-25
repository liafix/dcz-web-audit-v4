import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { productionConfigurationIssues } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const issues = productionConfigurationIssues();
  try {
    await db().execute(sql`select 1 as ok`);
    const healthy = issues.length === 0;
    return NextResponse.json(
      { status: healthy ? 'ok' : 'degraded', database: 'ok', configuration: healthy ? 'ok' : 'incomplete' },
      { status: healthy ? 200 : 503, headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'error', configuration: issues.length ? 'incomplete' : 'ok' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
