import 'server-only';

import type { TargetFetchDiagnostic } from '@/lib/errors/target-fetch-error';

export function correlationId(prefix = 'ERR'): string {
  return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

const SENSITIVE_KEY = /token|password|secret|authorization|cookie|html|body|email|phone|ip|query/i;
const SENSITIVE_TEXT = [
  /postgres(?:ql)?:\/\/[^\s]+/gi,
  /(?:authorization|cookie|token|password|secret)=?[^\s,;]*/gi,
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /https?:\/\/[^\s?#]+[?#][^\s]*/gi,
];

function sanitizeText(value: string): string {
  let output = value;
  for (const pattern of SENSITIVE_TEXT) output = output.replace(pattern, '[redacted]');
  return output.slice(0, 600);
}

function sanitizeValue(value: unknown, key = '', depth = 0): unknown {
  if (SENSITIVE_KEY.test(key)) return '[redacted]';
  if (depth > 4) return '[truncated]';
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitizeValue(item, '', depth + 1));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      output[childKey] = sanitizeValue(childValue, childKey, depth + 1);
    }
    return output;
  }
  return value;
}

function sanitize(input: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(input) as Record<string, unknown>;
}

export async function logApplicationEvent(input: {
  level: 'info' | 'warn' | 'error';
  event: string;
  errorId?: string;
  auditId?: string | null;
  error?: unknown;
  context?: Record<string, unknown>;
  targetFetch?: TargetFetchDiagnostic & { auditProcessingAttempt?: number };
}): Promise<void> {
  const payload = input.targetFetch
    ? {
        level: input.level,
        event: input.event,
        errorId: input.errorId,
        auditId: input.auditId,
        classification: input.targetFetch.classification,
        phase: input.targetFetch.phase,
        safeCauseCode: input.targetFetch.safeCauseCode,
        retryable: input.targetFetch.retryable,
        addressFamily: input.targetFetch.addressFamily,
        addressAttempt: input.targetFetch.addressAttempt,
        totalAddressAttempts: input.targetFetch.totalAddressAttempts,
        auditProcessingAttempt: input.targetFetch.auditProcessingAttempt,
        timestamp: new Date().toISOString(),
      }
    : (() => {
        const normalized = input.error instanceof Error ? input.error : null;
        return {
          level: input.level,
          event: input.event,
          errorId: input.errorId,
          auditId: input.auditId,
          message: normalized ? sanitizeText(normalized.message) : undefined,
          name: normalized?.name,
          stack: normalized?.stack
            ? sanitizeText(normalized.stack.split('\n').slice(0, 8).join('\n'))
            : undefined,
          context: sanitize(input.context ?? {}),
          timestamp: new Date().toISOString(),
        };
      })();

  const serialized = JSON.stringify(payload);
  if (input.level === 'error') console.error(serialized);
  else if (input.level === 'warn') console.warn(serialized);
  else console.info(serialized);

  const webhook = process.env.MONITORING_WEBHOOK_URL?.trim();
  if (!webhook || process.env.NODE_ENV !== 'production') return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: serialized,
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // Logging must never fail the business flow.
  }
}



