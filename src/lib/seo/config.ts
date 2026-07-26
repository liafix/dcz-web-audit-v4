export const CANONICAL_ORIGIN = 'https://dczweb.com';
export const SITE_NAME = 'DCZ WebAudit';
export const SITE_LOCALE = 'sk_SK';
export const SITE_LANGUAGE = 'sk-SK';

type SeoEnvironment = {
  NODE_ENV?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_PREVENT_INDEXING?: string;
  VERCEL_ENV?: string;
};

export function isIndexingPrevented(environment: SeoEnvironment = process.env): boolean {
  return (
    environment.NODE_ENV !== 'production' ||
    Boolean(environment.VERCEL_ENV && environment.VERCEL_ENV !== 'production') ||
    environment.NEXT_PUBLIC_PREVENT_INDEXING === 'true'
  );
}

export function canonicalUrl(path = '/'): string {
  const pathWithoutQueryOrHash = path.split(/[?#]/, 1)[0] || '/';
  const normalizedPath =
    pathWithoutQueryOrHash === '/'
      ? ''
      : `/${pathWithoutQueryOrHash.replace(/^\/+|\/+$/g, '')}`;
  return `${CANONICAL_ORIGIN}${normalizedPath}`;
}

export function metadataBaseUrl(environment: SeoEnvironment = process.env): URL {
  if (!isIndexingPrevented(environment)) return new URL(CANONICAL_ORIGIN);
  const explicit = environment.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      // Invalid deployment configuration is reported by the existing health checks.
    }
  }
  return new URL('http://localhost:3000');
}
