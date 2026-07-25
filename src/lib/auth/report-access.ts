import 'server-only';
import { cookies } from 'next/headers';
import { requiredSecret } from '@/lib/env';
import { sha256, signPayload, verifySignedPayload } from '@/lib/security/crypto';

const ACCESS_SECONDS = 60 * 60 * 72;

interface ReportAccessCookie {
  auditId: string;
  exp: number;
}

function cookieName(auditId: string): string {
  return `dcz_audit_access_${sha256(auditId).slice(0, 16)}`;
}

export async function grantReportAccess(auditId: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + ACCESS_SECONDS;
  const token = signPayload({ auditId, exp }, requiredSecret('ACCESS_COOKIE_SECRET'));
  (await cookies()).set(cookieName(auditId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_SECONDS,
    expires: new Date(exp * 1000),
  });
}

export async function hasReportAccess(auditId: string): Promise<boolean> {
  const token = (await cookies()).get(cookieName(auditId))?.value;
  const secret = process.env.ACCESS_COOKIE_SECRET?.trim();
  if (!token || !secret) return false;
  const payload = verifySignedPayload<ReportAccessCookie>(token, secret);
  return Boolean(
    payload && payload.auditId === auditId && payload.exp > Math.floor(Date.now() / 1000),
  );
}
