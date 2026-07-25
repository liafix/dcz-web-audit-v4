import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { requiredSecret } from '@/lib/env';
import { signPayload, verifySignedPayload } from '@/lib/security/crypto';

const COOKIE_NAME = 'dcz_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

interface AdminSession {
  email: string;
  exp: number;
}

export function verifyAdminPassword(password: string, encodedHash: string): boolean {
  const [algorithm, saltEncoded, hashEncoded] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !saltEncoded || !hashEncoded) return false;
  try {
    const salt = Buffer.from(saltEncoded, 'base64url');
    const expected = Buffer.from(hashEncoded, 'base64url');
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function createAdminSession(email: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = signPayload({ email, exp }, requiredSecret('ADMIN_SESSION_SECRET'));
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
    expires: new Date(exp * 1000),
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function adminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!token || !secret) return null;
  const session = verifySignedPayload<AdminSession>(token, secret);
  if (!session || session.exp <= Math.floor(Date.now() / 1000)) return null;
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!expectedEmail || session.email !== expectedEmail) return null;
  return session;
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await adminSession();
  if (!session) return redirect('/admin/login');
  return session;
}
