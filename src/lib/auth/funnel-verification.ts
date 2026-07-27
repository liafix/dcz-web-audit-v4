import 'server-only';
import { cookies } from 'next/headers';
import { isLiveProduction, requiredSecret } from '@/lib/env';
import { signPayload, verifySignedPayload } from '@/lib/security/crypto';

export const FUNNEL_SESSION_COOKIE = 'dcz_funnel_verification';
export const FUNNEL_SESSION_SECONDS = 25 * 60;
const FUNNEL_SESSION_PURPOSE = 'verified_audit_funnel';
const FUNNEL_SESSION_VERSION = 1;
const CLOCK_SKEW_SECONDS = 30;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface FunnelSessionClaims {
  purpose: string;
  version: number;
  auditId: string;
  iat: number;
  exp: number;
}

function funnelSessionSecret(required: boolean): string | null {
  const secret = process.env.FUNNEL_SESSION_SECRET?.trim();
  if (!secret) {
    if (required || isLiveProduction()) return requiredSecret('FUNNEL_SESSION_SECRET');
    return null;
  }
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('FUNNEL_SESSION_SECRET must contain at least 32 bytes.');
  }
  return secret;
}

function validClaims(
  claims: FunnelSessionClaims | null,
  auditId: string,
  now: number,
): claims is FunnelSessionClaims {
  if (!claims || typeof claims !== 'object') return false;
  const keys = Object.keys(claims).sort();
  if (keys.join(',') !== 'auditId,exp,iat,purpose,version') return false;
  if (claims.purpose !== FUNNEL_SESSION_PURPOSE || claims.version !== FUNNEL_SESSION_VERSION) {
    return false;
  }
  if (!UUID_PATTERN.test(claims.auditId) || claims.auditId !== auditId) return false;
  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)) return false;
  if (claims.iat > now + CLOCK_SKEW_SECONDS || claims.exp <= now || claims.exp <= claims.iat) {
    return false;
  }
  return claims.exp - claims.iat <= FUNNEL_SESSION_SECONDS;
}

export async function issueVerifiedFunnelSession(auditId: string): Promise<void> {
  if (!UUID_PATTERN.test(auditId)) throw new Error('Cannot issue a funnel session for an invalid audit ID.');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + FUNNEL_SESSION_SECONDS;
  const token = signPayload(
    {
      purpose: FUNNEL_SESSION_PURPOSE,
      version: FUNNEL_SESSION_VERSION,
      auditId,
      iat: now,
      exp,
    },
    funnelSessionSecret(true)!,
  );
  (await cookies()).set(FUNNEL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: FUNNEL_SESSION_SECONDS,
    expires: new Date(exp * 1000),
  });
}

export async function hasVerifiedFunnelSession(auditId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(auditId)) return false;
  const token = (await cookies()).get(FUNNEL_SESSION_COOKIE)?.value;
  const secret = funnelSessionSecret(false);
  if (!token || !secret) return false;
  if (token.length > 2048 || token.split('.').length !== 2) return false;
  const claims = verifySignedPayload<FunnelSessionClaims>(token, secret);
  return validClaims(claims, auditId, Math.floor(Date.now() / 1000));
}
