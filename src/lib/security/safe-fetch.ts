import { Agent, fetch as undiciFetch } from 'undici';
import { normalizeUrl } from '@/lib/security/normalize-url';
import { resolvePublicHost, type ResolvedAddress } from '@/lib/security/resolve-host';

export interface SafeFetchResult {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
  bodyBytes: number;
  durationMs: number;
  responseHeaders: Record<string, string | null>;
  redirects: string[];
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
  deadlineAt?: number;
}

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain',
  'application/xml',
  'text/xml',
];

function dispatcherFor(address: ResolvedAddress): Agent {
  return new Agent({
    connect: {
      lookup: ((_hostname: string, optionsOrCallback: unknown, maybeCallback?: unknown) => {
        const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
        if (typeof callback !== 'function') return;
        const all =
          typeof optionsOrCallback === 'object' &&
          optionsOrCallback !== null &&
          'all' in optionsOrCallback &&
          Boolean((optionsOrCallback as { all?: boolean }).all);
        if (all) callback(null, [{ address: address.address, family: address.family }]);
        else callback(null, address.address, address.family);
      }) as never,
    },
  });
}

function effectiveTimeout(timeoutMs: number, deadlineAt?: number): number {
  if (!deadlineAt) return timeoutMs;
  const remaining = deadlineAt - Date.now();
  if (remaining <= 250) throw new Error('Audit prekročil celkový časový deadline.');
  return Math.max(250, Math.min(timeoutMs, remaining));
}

async function readLimitedBody(
  response: Awaited<ReturnType<typeof undiciFetch>>,
  maxBytes: number,
  signal: AbortSignal,
): Promise<{ body: string; bytes: number }> {
  const reader = response.body?.getReader();
  if (!reader) return { body: '', bytes: 0 };
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const chunks: string[] = [];
  let total = 0;

  try {
    while (true) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Dokument prekročil bezpečnostný limit veľkosti.');
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return { body: chunks.join(''), bytes: total };
  } catch (error) {
    try { await reader.cancel(); } catch { /* best effort */ }
    throw error;
  }
}

function selectedHeaders(response: Awaited<ReturnType<typeof undiciFetch>>): Record<string, string | null> {
  return {
    'content-encoding': response.headers.get('content-encoding'),
    'strict-transport-security': response.headers.get('strict-transport-security'),
    'content-security-policy': response.headers.get('content-security-policy'),
    'x-content-type-options': response.headers.get('x-content-type-options'),
    'referrer-policy': response.headers.get('referrer-policy'),
    'x-frame-options': response.headers.get('x-frame-options'),
    server: response.headers.get('server'),
  };
}

export async function safeFetchText(
  inputUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? 3;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxBytes = options.maxBytes ?? 1_000_000;
  const redirects: string[] = [];
  const startedAt = Date.now();
  let current = inputUrl;

  for (let redirectAttempt = 0; redirectAttempt <= maxRedirects; redirectAttempt += 1) {
    const target = normalizeUrl(current);
    let redirectedThisAttempt = false;
    const dnsBudget = effectiveTimeout(4_000, options.deadlineAt);
    const addresses = await resolvePublicHost(target.hostname, dnsBudget);
    let lastNetworkError: unknown = null;

    for (const address of addresses.slice(0, 3)) {
      const dispatcher = dispatcherFor(address);
      const controller = new AbortController();
      const requestTimeout = effectiveTimeout(timeoutMs, options.deadlineAt);
      const timeout = setTimeout(() => controller.abort(), requestTimeout);
      try {
        const response = await undiciFetch(target.url, {
          method: 'GET',
          redirect: 'manual',
          dispatcher,
          signal: controller.signal,
          headers: {
            'user-agent': 'DCZ-WebAudit-Next/3.0 (+https://dczweb.com/methodology)',
            accept: 'text/html,application/xhtml+xml,text/plain,application/xml,text/xml;q=0.8,*/*;q=0.1',
            'accept-language': 'sk,en;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
          },
        });
        const status = response.status;

        if (status >= 300 && status < 400) {
          const location = response.headers.get('location');
          await response.body?.cancel();
          if (!location) throw new Error('Web vrátil presmerovanie bez cieľovej adresy.');
          if (redirectAttempt === maxRedirects) throw new Error('Web obsahuje príliš veľa presmerovaní.');
          current = new URL(location, target.url).toString();
          redirects.push(current);
          redirectedThisAttempt = true;
          break;
        }

        if (status < 200 || status >= 400) {
          await response.body?.cancel();
          throw new Error(`Web vrátil HTTP stav ${status}.`);
        }

        const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
        if (!ALLOWED_CONTENT_TYPES.some((type) => contentType.startsWith(type))) {
          await response.body?.cancel();
          throw new Error('Cieľ nevrátil podporovaný textový dokument.');
        }

        const contentLength = Number(response.headers.get('content-length') ?? 0);
        if (contentLength > maxBytes) {
          await response.body?.cancel();
          throw new Error('Dokument prekročil bezpečnostný limit veľkosti.');
        }

        const headers = selectedHeaders(response);
        const { body, bytes } = await readLimitedBody(response, maxBytes, controller.signal);
        return {
          requestedUrl: inputUrl,
          finalUrl: target.url,
          status,
          contentType,
          body,
          bodyBytes: bytes,
          durationMs: Date.now() - startedAt,
          responseHeaders: headers,
          redirects,
        };
      } catch (error) {
        lastNetworkError = error;
        if (error instanceof Error && error.name === 'AbortError') {
          lastNetworkError = new Error('Webstránka neodpovedala v časovom limite.');
        }
        const message = lastNetworkError instanceof Error ? lastNetworkError.message : '';
        const terminal =
          message.includes('HTTP stav') ||
          message.includes('podporovaný') ||
          message.includes('limit veľkosti') ||
          message.includes('presmerovanie') ||
          message.includes('deadline');
        if (terminal) throw lastNetworkError;
      } finally {
        clearTimeout(timeout);
        await dispatcher.close();
      }
    }

    if (redirectedThisAttempt) continue;
    if (lastNetworkError instanceof Error) throw lastNetworkError;
    throw new Error('Webstránku sa nepodarilo bezpečne načítať.');
  }

  throw new Error('Presmerovanie sa nepodarilo bezpečne dokončiť.');
}
