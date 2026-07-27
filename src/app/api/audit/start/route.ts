import { NextResponse } from 'next/server';
import { recordFunnelEventSafe, recordSecurityEventSafe } from '@/lib/analytics/funnel';
import { countRecentAuditsByFingerprint, createAudit } from '@/lib/db/queries';
import { appUrl } from '@/lib/env';
import { PublicAppError } from '@/lib/errors/public-error';
import { readJsonBody } from '@/lib/http/request';
import { jsonError } from '@/lib/http/response';
import { enforceRateLimit } from '@/lib/rate-limit/server-rate-limit';
import { normalizeUrl } from '@/lib/security/normalize-url';
import { randomToken, sha256 } from '@/lib/security/crypto';
import { requestFingerprint } from '@/lib/security/request-fingerprint';
import { verifyTurnstileDetailed } from '@/lib/security/turnstile';
import { assertSameOrigin } from '@/lib/security/request-origin';
import { startAuditSchema } from '@/lib/validation/audit';

export const runtime = 'nodejs';
export const maxDuration = 15;

function referrerHost(request: Request, supplied?: string | null): string | null {
  if (supplied) return supplied.slice(0, 255);
  try {
    const value = request.headers.get('referer');
    return value ? new URL(value).hostname.slice(0, 255) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request, 12_000);
    const parsed = startAuditSchema.safeParse(body);
    if (!parsed.success) {
      throw new PublicAppError({
        code: 'invalid_url',
        status: 422,
        publicMessage: 'Zadajte platnú URL webstránky.',
      });
    }
    if (parsed.data.website) {
      throw new PublicAppError({
        code: 'request_rejected',
        status: 422,
        publicMessage: 'Požiadavku nebolo možné overiť.',
      });
    }
    const turnstile = await verifyTurnstileDetailed(
      request,
      parsed.data.turnstileToken ?? null,
    );
    if (!turnstile.success) {
      throw new PublicAppError({
        code: 'turnstile_failed',
        status: 422,
        publicMessage: 'Bezpečnostné overenie zlyhalo. Obnovte stránku a skúste to znova.',
        details: {
          siteverifyHttpStatus: turnstile.siteverifyHttpStatus,
          siteverifySuccess: turnstile.success,
          siteverifyErrorCodes: turnstile.errorCodes,
          expectedHostname: new URL(appUrl()).hostname.toLowerCase(),
          returnedHostname: turnstile.returnedHostname,
          expectedAction: null,
          returnedAction: turnstile.returnedAction,
          failureClassification: turnstile.failureClassification,
        },
      });
    }

    let target: ReturnType<typeof normalizeUrl>;
    try {
      target = normalizeUrl(parsed.data.url);
    } catch (error) {
      throw new PublicAppError({
        code: 'invalid_or_unsafe_url',
        status: 422,
        publicMessage: 'Zadanú adresu nie je možné bezpečne analyzovať. Skontrolujte URL.',
        internalMessage: error instanceof Error ? error.message : undefined,
      });
    }

    const fingerprint = requestFingerprint(request);
    const hourSubjectHash = await enforceRateLimit({
      action: 'audit_start_hour',
      subject: fingerprint,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    const daySubjectHash = await enforceRateLimit({
      action: 'audit_start_day',
      subject: fingerprint,
      limit: 25,
      windowMs: 24 * 60 * 60 * 1000,
    });

    const [hourCount, dayCount] = await Promise.all([
      countRecentAuditsByFingerprint(fingerprint, new Date(Date.now() - 60 * 60 * 1000)),
      countRecentAuditsByFingerprint(fingerprint, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ]);
    if (hourCount >= 5 || dayCount >= 25) {
      throw new PublicAppError({
        code: 'rate_limited',
        status: 429,
        publicMessage: 'Dosiahli ste bezpečnostný limit auditov. Skúste to neskôr.',
      });
    }

    const audit = await createAudit({
      id: crypto.randomUUID(),
      publicToken: `audit_${randomToken(24)}`,
      targetUrl: target.url,
      normalizedUrl: target.url,
      origin: target.origin,
      deduplicationKey: sha256(target.url),
      requestFingerprint: fingerprint,
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      utmSource: parsed.data.utmSource ?? null,
      utmMedium: parsed.data.utmMedium ?? null,
      utmCampaign: parsed.data.utmCampaign ?? null,
      referrerHost: referrerHost(request, parsed.data.referrerHost),
    });

    await Promise.all([
      recordFunnelEventSafe({
        auditId: audit.id,
        event: 'audit_started',
        sessionHash: fingerprint,
        utmSource: audit.utmSource,
        utmMedium: audit.utmMedium,
        utmCampaign: audit.utmCampaign,
        referrerHost: audit.referrerHost,
      }),
      recordSecurityEventSafe({
        action: 'audit_start_hour',
        subjectHash: hourSubjectHash,
        auditId: audit.id,
        success: true,
      }),
      recordSecurityEventSafe({
        action: 'audit_start_day',
        subjectHash: daySubjectHash,
        auditId: audit.id,
        success: true,
      }),
    ]);

    return NextResponse.json({ token: audit.publicToken }, { status: 201 });
  } catch (error) {
    return jsonError(error, {
      code: 'audit_start_failed',
      status: 500,
      message: 'Audit momentálne nie je dostupný. Skúste to, prosím, o chvíľu.',
      context: { route: 'audit_start' },
    });
  }
}
