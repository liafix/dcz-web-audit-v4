import { isLiveProduction, turnstileEnabled } from '@/lib/env';
import { PublicAppError } from '@/lib/errors/public-error';
import { requestIp } from '@/lib/security/request-fingerprint';

export type TurnstileFailureClassification =
  | 'siteverify_non_2xx'
  | 'siteverify_timeout'
  | 'siteverify_network_error'
  | 'siteverify_invalid_json'
  | 'siteverify_rejected';

export interface TurnstileVerificationResult {
  siteverifyHttpStatus: number | null;
  success: boolean;
  errorCodes: string[];
  returnedHostname: string | null;
  returnedAction: string | null;
  failureClassification: TurnstileFailureClassification | null;
}

function verificationResult(
  input: Partial<TurnstileVerificationResult> &
    Pick<TurnstileVerificationResult, 'success' | 'failureClassification'>,
): TurnstileVerificationResult {
  return {
    siteverifyHttpStatus: input.siteverifyHttpStatus ?? null,
    success: input.success,
    errorCodes: input.errorCodes ?? [],
    returnedHostname: input.returnedHostname ?? null,
    returnedAction: input.returnedAction ?? null,
    failureClassification: input.failureClassification,
  };
}

function sanitizeErrorCodes(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ['invalid-error-codes'];

  return value.slice(0, 8).map((entry) => {
    if (typeof entry !== 'string') return 'invalid-error-code';
    const normalized = entry.trim().toLowerCase();
    if (!normalized || normalized.length > 64 || !/^[a-z0-9-]+$/.test(normalized)) {
      return 'invalid-error-code';
    }
    return normalized;
  });
}

function sanitizeHostname(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return 'invalid-hostname';
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 253 || !/^[a-z0-9.-]+$/.test(normalized)) {
    return 'invalid-hostname';
  }
  return normalized;
}

function sanitizeAction(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return 'invalid-action';
  const normalized = value.trim();
  if (!normalized || normalized.length > 64 || !/^[A-Za-z0-9_-]+$/.test(normalized)) {
    return 'invalid-action';
  }
  return normalized;
}

function isTimeoutFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('name' in error)) return false;
  return error.name === 'AbortError' || error.name === 'TimeoutError';
}

export async function verifyTurnstileDetailed(
  request: Request,
  token: string | null,
): Promise<TurnstileVerificationResult> {
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
    return verificationResult({ success: true, failureClassification: null });
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
  if (!token || !token.trim() || token.length > 2048) {
    return verificationResult({
      success: false,
      failureClassification: 'siteverify_rejected',
    });
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: requestIp(request),
  });

  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    return verificationResult({
      success: false,
      failureClassification: isTimeoutFailure(error)
        ? 'siteverify_timeout'
        : 'siteverify_network_error',
    });
  }

  if (!response.ok) {
    return verificationResult({
      siteverifyHttpStatus: response.status,
      success: false,
      failureClassification: 'siteverify_non_2xx',
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return verificationResult({
      siteverifyHttpStatus: response.status,
      success: false,
      failureClassification: 'siteverify_invalid_json',
    });
  }

  const record =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  const success = record?.success === true;

  return verificationResult({
    siteverifyHttpStatus: response.status,
    success,
    errorCodes: sanitizeErrorCodes(record?.['error-codes']),
    returnedHostname: sanitizeHostname(record?.hostname),
    returnedAction: sanitizeAction(record?.action),
    failureClassification: success ? null : 'siteverify_rejected',
  });
}

export async function verifyTurnstile(request: Request, token: string | null): Promise<boolean> {
  return (await verifyTurnstileDetailed(request, token)).success;
}
