import { appUrl, isLiveProduction } from '@/lib/env';
import { PublicAppError } from '@/lib/errors/public-error';

export function assertSameOrigin(request: Request): void {
  const allowedOrigins = new Set([new URL(appUrl()).origin]);
  if (!isLiveProduction()) allowedOrigins.add(new URL(request.url).origin);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (!origin && !referer) {
    throw new PublicAppError({ code: 'missing_origin', status: 403, publicMessage: 'Požiadavku sa nepodarilo bezpečne overiť.' });
  }
  if (origin && !allowedOrigins.has(origin)) {
    throw new PublicAppError({ code: 'invalid_origin', status: 403, publicMessage: 'Požiadavku sa nepodarilo bezpečne overiť.' });
  }
  if (!origin && referer) {
    try {
      if (!allowedOrigins.has(new URL(referer).origin)) throw new Error('origin_mismatch');
    } catch {
      throw new PublicAppError({ code: 'invalid_origin', status: 403, publicMessage: 'Požiadavku sa nepodarilo bezpečne overiť.' });
    }
  }
}
