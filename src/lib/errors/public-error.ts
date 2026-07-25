import { correlationId, logApplicationEvent } from '@/lib/monitoring/logger';

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
  const status = publicError?.status ?? fallback.status ?? 500;
  const code = publicError?.code ?? fallback.code ?? 'internal_error';
  const message =
    publicError?.publicMessage ??
    fallback.message ??
    'Služba momentálne nie je dostupná. Skúste to, prosím, o chvíľu.';

  void logApplicationEvent({
    level: status >= 500 ? 'error' : 'warn',
    event: code,
    errorId,
    error,
    context: { ...fallback.context, details: publicError?.details },
  });

  return { status, payload: { error: message, code, errorId } };
}

export function safeAuditFailure(error: unknown): {
  code: string;
  publicMessage: string;
  internalMessage: string;
} {
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
