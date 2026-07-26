import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ORIGIN,
  canonicalUrl,
  isIndexingPrevented,
  metadataBaseUrl,
} from '@/lib/seo/config';

const production = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_APP_URL: CANONICAL_ORIGIN,
  NEXT_PUBLIC_PREVENT_INDEXING: 'false',
} as NodeJS.ProcessEnv;

describe('SEO environment and canonical policy', () => {
  it('enables indexing only for the public production environment', () => {
    expect(isIndexingPrevented(production)).toBe(false);
    expect(isIndexingPrevented({ ...production, NEXT_PUBLIC_PREVENT_INDEXING: 'true' })).toBe(true);
    expect(isIndexingPrevented({ ...production, VERCEL_ENV: 'preview' })).toBe(true);
    expect(isIndexingPrevented({ ...production, NODE_ENV: 'development' })).toBe(true);
  });

  it('builds canonical URLs on the approved apex origin without query data', () => {
    expect(canonicalUrl('/')).toBe('https://dczweb.com');
    expect(canonicalUrl('/methodology/')).toBe('https://dczweb.com/methodology');
    expect(canonicalUrl('contact')).toBe('https://dczweb.com/contact');
    expect(canonicalUrl('/methodology?utm_source=test')).not.toContain('?');
  });

  it('uses the canonical base in production and the deployment base on staging', () => {
    expect(metadataBaseUrl(production).toString()).toBe('https://dczweb.com/');
    expect(metadataBaseUrl({
      ...production,
      NEXT_PUBLIC_APP_URL: 'https://preview.example.test',
      NEXT_PUBLIC_PREVENT_INDEXING: 'true',
    }).toString()).toBe('https://preview.example.test/');
  });
});

