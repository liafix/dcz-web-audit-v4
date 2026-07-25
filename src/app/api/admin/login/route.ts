import { NextResponse } from 'next/server';
import { recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { createAdminSession, verifyAdminPassword } from '@/lib/auth/admin-session';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { requestIp } from '@/lib/security/request-fingerprint';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { adminLoginSchema } from '@/lib/validation/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = adminLoginSchema.safeParse(await readJsonBody(request, 8_000));
    if (!parsed.success) {
      throw new PublicAppError({ code: 'invalid_admin_login', status: 422, publicMessage: 'Neplatné prihlasovacie údaje.' });
    }
    if (!(await verifyTurnstile(request, parsed.data.turnstileToken ?? null))) {
      throw new PublicAppError({ code: 'turnstile_failed', status: 422, publicMessage: 'Bezpečnostné overenie zlyhalo.' });
    }

    const ipHash = await enforceRateLimit({
      action: 'admin_login_ip', subject: requestIp(request), limit: 5, windowMs: 15 * 60 * 1000,
    });
    const accountHash = await enforceRateLimit({
      action: 'admin_login_account', subject: parsed.data.email, limit: 10, windowMs: 24 * 60 * 60 * 1000,
    });

    const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
    if (!expectedEmail || !passwordHash) {
      throw new PublicAppError({ code: 'admin_unavailable', status: 503, publicMessage: 'Admin prihlásenie momentálne nie je dostupné.' });
    }

    const valid = parsed.data.email === expectedEmail && verifyAdminPassword(parsed.data.password, passwordHash);
    await Promise.all([
      recordSecurityEventSafe({ action: 'admin_login_ip', subjectHash: ipHash, success: valid }),
      recordSecurityEventSafe({ action: 'admin_login_account', subjectHash: accountHash, success: valid }),
    ]);
    if (!valid) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      throw new PublicAppError({ code: 'admin_login_failed', status: 401, publicMessage: 'Neplatné prihlasovacie údaje.' });
    }

    await createAdminSession(expectedEmail);
    return NextResponse.json({ success: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return jsonError(error, { code: 'admin_login_error', status: 500, message: 'Prihlásenie sa nepodarilo.', context: { route: 'admin_login' } });
  }
}
