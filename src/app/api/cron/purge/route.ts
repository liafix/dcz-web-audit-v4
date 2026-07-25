import { NextResponse } from 'next/server';
import { purgeExpiredData } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  return NextResponse.json(await purgeExpiredData(), { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) { return run(request); }
export async function GET(request: Request) { return run(request); }
