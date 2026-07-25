import { isLiveProduction, turnstileEnabled } from '@/lib/env';
import { PublicAppError } from '@/lib/errors/public-error';
import { requestIp } from '@/lib/security/request-fingerprint';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstile(request: Request, token: string | null): Promise<boolean> {
  const enabled = turnstileEnabled();
  if (!enabled) {
    if (isLiveProduction()) {
      throw new PublicAppError({
        code: 'security_not_configured',
        status: 503,
        publicMessage: 'Bezpečnostná ochrana služby nie je pripravená. Skúste to neskôr.',
        internalMessage: 'TURNSTILE_ENABLED must be true in live production.',
      });
    }
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret || !siteKey) {
    throw new PublicAppError({
      code: 'security_not_configured',
      status: 503,
      publicMessage: 'Bezpečnostná ochrana služby nie je pripravená. Skúste to neskôr.',
      internalMessage: 'Turnstile is enabled but site or secret key is missing.',
    });
  }
  if (!token) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: requestIp(request),
  });

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileResponse;
    return result.success;
  } catch {
    return false;
  }
}
