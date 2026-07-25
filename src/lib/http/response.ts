import { NextResponse } from 'next/server';
import { publicErrorPayload } from '@/lib/errors/public-error';

export function jsonError(
  error: unknown,
  fallback?: {
    code?: string;
    status?: number;
    message?: string;
    context?: Record<string, unknown>;
  },
): NextResponse {
  const result = publicErrorPayload(error, fallback);
  return NextResponse.json(result.payload, {
    status: result.status,
    headers: { 'cache-control': 'no-store' },
  });
}
