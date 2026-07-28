import { correlationId, logApplicationEvent } from '@/lib/monitoring/logger';
import {
  TargetFetchError,
  targetFetchDiagnostic,
} from '@/lib/errors/target-fetch-error';

export const TARGET_CONNECTION_TIMEOUT_PUBLIC_MESSAGE =
  'Cieľový server sa z našej auditnej infraštruktúry nepodarilo kontaktovať v časovom limite. Môže byť dočasne nedostupný alebo môže existovať problém v sieťovej ceste. Skúste audit neskôr.';

export class PublicAppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly publicMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(input: {
    code: string;
    status: number;
    publicMessage: string;
    internalMessage?: string;
    details?: Record<string, unknown>;
  }) {
    super(input.internalMessage ?? input.publicMessage);
    this.name = 'PublicAppError';
    this.code = input.code;
    this.status = input.status;
    this.publicMessage = input.publicMessage;
    this.details = input.details;
  }
}

export interface PublicErrorPayload {
  error: string;
  code: string;
  errorId: string;
}

export function publicErrorPayload(
  error: unknown,
  fallback: {
    code?: string;
    status?: number;
    message?: string;
    context?: Record<string, unknown>;
  } = {},
): { status: number; payload: PublicErrorPayload } {
  const errorId = correlationId();
  const publicError = error instanceof PublicAppError ? error : null;
  const targetFailure = error instanceof TargetFetchError ? safeAuditFailure(error) : null;
  const status = publicError?.status ?? fallback.status ?? 500;
  const code = publicError?.code ?? targetFailure?.code ?? fallback.code ?? 'internal_error';
  const message =
    publicError?.publicMessage ??
    targetFailure?.publicMessage ??
    fallback.message ??
    'Služba momentálne nie je dostupná. Skúste to, prosím, o chvíľu.';

  if (error instanceof TargetFetchError) {
    void logApplicationEvent({
      level: status >= 500 ? 'error' : 'warn',
      event: code,
      errorId,
      targetFetch: targetFetchDiagnostic(error),
    });
  } else {
    void logApplicationEvent({
      level: status >= 500 ? 'error' : 'warn',
      event: code,
      errorId,
      error,
      context: { ...fallback.context, details: publicError?.details },
    });
  }

  return { status, payload: { error: message, code, errorId } };
}

export function safeAuditFailure(error: unknown): {
  code: string;
  publicMessage: string;
  internalMessage: string;
} {
  if (error instanceof TargetFetchError) {
    const publicMessage = (() => {
      switch (error.classification) {
        case 'connection_timeout':
          return TARGET_CONNECTION_TIMEOUT_PUBLIC_MESSAGE;
        case 'dns_not_found':
        case 'dns_temporary_failure':
        case 'dns_timeout':
          return 'Doménu sa nepodarilo načítať. Skontrolujte adresu a skúste audit neskôr.';
        case 'unsafe_resolved_address':
          return 'Zadanú adresu nie je možné z bezpečnostných dôvodov analyzovať.';
        case 'connection_refused':
        case 'connection_reset':
          return 'Cieľový server prerušil alebo odmietol spojenie. Skúste audit neskôr.';
        case 'tls_certificate_expired':
        case 'tls_certificate_untrusted':
        case 'tls_hostname_mismatch':
        case 'tls_handshake_failure':
          return 'S cieľovým serverom sa nepodarilo vytvoriť dôveryhodné zabezpečené spojenie.';
        case 'headers_timeout':
        case 'body_timeout':
          return 'Cieľový server neodoslal odpoveď v časovom limite. Skúste audit neskôr.';
        case 'redirect_failure':
          return 'Presmerovanie cieľovej stránky sa nepodarilo bezpečne dokončiť.';
        case 'unsupported_content_type':
          return 'Cieľová stránka nevrátila podporovaný textový dokument.';
        case 'response_too_large':
          return 'Cieľová stránka prekročila bezpečnostný limit veľkosti.';
        case 'target_http_error':
          return 'Cieľová stránka vrátila chybu a audit sa nedal dokončiť.';
        case 'decompression_failure':
        case 'unknown_network_error':
          return 'Audit sa nepodarilo dokončiť pre chybu pri načítaní cieľovej stránky. Skúste audit neskôr.';
      }
    })();
    return {
      code: error.classification,
      publicMessage,
      internalMessage: error.message,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown audit failure';
  const lower = message.toLowerCase();

  if (lower.includes('časovom limite') || lower.includes('timeout') || lower.includes('deadline')) {
    return {
      code: 'target_timeout',
      publicMessage: 'Webstránka neodpovedala v časovom limite. Audit môžete skúsiť zopakovať.',
      internalMessage: message,
    };
  }
  if (lower.includes('dns') || lower.includes('verejnú ip')) {
    return {
      code: 'target_dns_error',
      publicMessage: 'Doménu sa nepodarilo bezpečne načítať. Skontrolujte adresu a skúste to znova.',
      internalMessage: message,
    };
  }
  if (lower.includes('http stav')) {
    return {
      code: 'target_http_error',
      publicMessage: 'Cieľová stránka vrátila chybu a audit sa nedal dokončiť.',
      internalMessage: message,
    };
  }
  if (lower.includes('bezpečnost') || lower.includes('private') || lower.includes('zakáz')) {
    return {
      code: 'unsafe_target',
      publicMessage: 'Zadanú adresu nie je možné z bezpečnostných dôvodov analyzovať.',
      internalMessage: message,
    };
  }

  return {
    code: 'audit_failed',
    publicMessage: 'Audit sa nepodarilo dokončiť. Skúste to, prosím, znova alebo kontaktujte DCZ.',
    internalMessage: message,
  };
}
