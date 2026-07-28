export const TARGET_FETCH_PHASES = [
  'dns',
  'connect',
  'tls',
  'headers',
  'body',
  'redirect',
  'policy',
  'unknown',
] as const;

export type TargetFetchPhase = (typeof TARGET_FETCH_PHASES)[number];

export const TARGET_FETCH_CLASSIFICATIONS = [
  'dns_not_found',
  'dns_temporary_failure',
  'dns_timeout',
  'unsafe_resolved_address',
  'connection_refused',
  'connection_reset',
  'connection_timeout',
  'tls_certificate_expired',
  'tls_certificate_untrusted',
  'tls_hostname_mismatch',
  'tls_handshake_failure',
  'headers_timeout',
  'body_timeout',
  'decompression_failure',
  'redirect_failure',
  'unsupported_content_type',
  'response_too_large',
  'target_http_error',
  'unknown_network_error',
] as const;

export type TargetFetchClassification = (typeof TARGET_FETCH_CLASSIFICATIONS)[number];

export const SAFE_TARGET_FETCH_CAUSE_CODES = [
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
] as const;

export type SafeTargetFetchCauseCode =
  | (typeof SAFE_TARGET_FETCH_CAUSE_CODES)[number]
  | 'unknown';

export type TargetAddressFamily = 4 | 6 | null;

export interface TargetFetchDiagnostic {
  classification: TargetFetchClassification;
  phase: TargetFetchPhase;
  safeCauseCode: SafeTargetFetchCauseCode;
  retryable: boolean;
  addressFamily: TargetAddressFamily;
  addressAttempt: number;
  totalAddressAttempts: number;
  httpStatus?: number;
}

const SAFE_INTERNAL_MESSAGES: Record<TargetFetchClassification, string> = {
  dns_not_found: 'Target DNS name was not found.',
  dns_temporary_failure: 'Target DNS resolution failed temporarily.',
  dns_timeout: 'Target DNS resolution timed out.',
  unsafe_resolved_address: 'Target resolved to a disallowed address.',
  connection_refused: 'Target connection was refused.',
  connection_reset: 'Target connection was reset.',
  connection_timeout: 'Target connection timed out.',
  tls_certificate_expired: 'Target TLS certificate has expired.',
  tls_certificate_untrusted: 'Target TLS certificate is not trusted.',
  tls_hostname_mismatch: 'Target TLS certificate hostname does not match.',
  tls_handshake_failure: 'Target TLS handshake failed.',
  headers_timeout: 'Target response headers timed out.',
  body_timeout: 'Target response body timed out.',
  decompression_failure: 'Target response decompression failed.',
  redirect_failure: 'Target redirect could not be followed safely.',
  unsupported_content_type: 'Target returned an unsupported content type.',
  response_too_large: 'Target response exceeded the size limit.',
  target_http_error: 'Target returned an unsuccessful HTTP status.',
  unknown_network_error: 'Target request failed for an unknown network reason.',
};

export class TargetFetchError extends Error implements TargetFetchDiagnostic {
  readonly classification: TargetFetchClassification;
  readonly phase: TargetFetchPhase;
  readonly safeCauseCode: SafeTargetFetchCauseCode;
  readonly retryable: boolean;
  readonly addressFamily: TargetAddressFamily;
  readonly addressAttempt: number;
  readonly totalAddressAttempts: number;
  readonly httpStatus?: number;

  constructor(input: TargetFetchDiagnostic) {
    super(SAFE_INTERNAL_MESSAGES[input.classification]);
    this.name = 'TargetFetchError';
    this.classification = input.classification;
    this.phase = input.phase;
    this.safeCauseCode = input.safeCauseCode;
    this.retryable = input.retryable;
    this.addressFamily = input.addressFamily;
    this.addressAttempt = input.addressAttempt;
    this.totalAddressAttempts = input.totalAddressAttempts;
    this.httpStatus = input.httpStatus;
  }
}

const SAFE_CODE_SET = new Set<string>(SAFE_TARGET_FETCH_CAUSE_CODES);

function safeCodeFromValue(value: unknown): SafeTargetFetchCauseCode {
  return typeof value === 'string' && SAFE_CODE_SET.has(value)
    ? (value as SafeTargetFetchCauseCode)
    : 'unknown';
}

export function safeCauseCode(error: unknown): SafeTargetFetchCauseCode {
  const visited = new Set<object>();
  let current = error;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object' || visited.has(current)) return 'unknown';
    visited.add(current);
    const record = current as Record<string, unknown>;
    const code = safeCodeFromValue(record.code);
    if (code !== 'unknown') return code;
    current = record.cause;
  }

  return 'unknown';
}

function diagnosticForCode(
  code: SafeTargetFetchCauseCode,
): Pick<TargetFetchDiagnostic, 'classification' | 'phase' | 'retryable'> {
  switch (code) {
    case 'ENOTFOUND':
      return { classification: 'dns_not_found', phase: 'dns', retryable: false };
    case 'EAI_AGAIN':
      return { classification: 'dns_temporary_failure', phase: 'dns', retryable: true };
    case 'ECONNREFUSED':
      return { classification: 'connection_refused', phase: 'connect', retryable: true };
    case 'ECONNRESET':
    case 'UND_ERR_SOCKET':
      return { classification: 'connection_reset', phase: 'connect', retryable: true };
    case 'ETIMEDOUT':
    case 'UND_ERR_CONNECT_TIMEOUT':
      return { classification: 'connection_timeout', phase: 'connect', retryable: true };
    case 'UND_ERR_HEADERS_TIMEOUT':
      return { classification: 'headers_timeout', phase: 'headers', retryable: true };
    case 'UND_ERR_BODY_TIMEOUT':
      return { classification: 'body_timeout', phase: 'body', retryable: true };
    case 'CERT_HAS_EXPIRED':
      return { classification: 'tls_certificate_expired', phase: 'tls', retryable: false };
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
      return { classification: 'tls_certificate_untrusted', phase: 'tls', retryable: false };
    case 'ERR_TLS_CERT_ALTNAME_INVALID':
      return { classification: 'tls_hostname_mismatch', phase: 'tls', retryable: false };
    case 'unknown':
      return { classification: 'unknown_network_error', phase: 'unknown', retryable: true };
  }
}

export function classifyTargetFetchError(
  error: unknown,
  attempt: {
    addressFamily?: TargetAddressFamily;
    addressAttempt?: number;
    totalAddressAttempts?: number;
    phase?: TargetFetchPhase;
  } = {},
): TargetFetchError {
  if (error instanceof TargetFetchError) {
    return new TargetFetchError({
      classification: error.classification,
      phase: error.phase,
      safeCauseCode: error.safeCauseCode,
      retryable: error.retryable,
      addressFamily: attempt.addressFamily ?? error.addressFamily,
      addressAttempt: attempt.addressAttempt ?? error.addressAttempt,
      totalAddressAttempts: attempt.totalAddressAttempts ?? error.totalAddressAttempts,
      ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
    });
  }

  const code = safeCauseCode(error);
  const mapped = diagnosticForCode(code);
  const dnsTimeout =
    code === 'ETIMEDOUT' && attempt.phase === 'dns'
      ? { classification: 'dns_timeout' as const, phase: 'dns' as const, retryable: true }
      : null;
  return new TargetFetchError({
    ...(dnsTimeout ?? mapped),
    phase: dnsTimeout?.phase ?? (mapped.phase === 'unknown' ? (attempt.phase ?? 'unknown') : mapped.phase),
    safeCauseCode: code,
    addressFamily: attempt.addressFamily ?? null,
    addressAttempt: attempt.addressAttempt ?? 0,
    totalAddressAttempts: attempt.totalAddressAttempts ?? 0,
  });
}

export function targetFetchDiagnostic(error: TargetFetchError): TargetFetchDiagnostic {
  return {
    classification: error.classification,
    phase: error.phase,
    safeCauseCode: error.safeCauseCode,
    retryable: error.retryable,
    addressFamily: error.addressFamily,
    addressAttempt: error.addressAttempt,
    totalAddressAttempts: error.totalAddressAttempts,
    ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
  };
}
