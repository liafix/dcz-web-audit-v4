import { describe, expect, it } from 'vitest';
import { PRODUCTION_SITEMAP_PATHS, buildSitemap } from '@/app/sitemap';
import { canonicalUrl } from '@/lib/seo/config';

const production = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_PREVENT_INDEXING: 'false',
} as NodeJS.ProcessEnv;

const forbidden = ['/api/', '/admin/', '/audit/', '/access/', '/brief/', '/book/', '/unsubscribe/'];

describe('sitemap metadata route', () => {
  it('contains exactly the approved public production allowlist', () => {
    const sitemap = buildSitemap(production);
    expect(sitemap.map((item) => item.url)).toEqual(
      PRODUCTION_SITEMAP_PATHS.map((path) => canonicalUrl(path)),
    );
    expect(sitemap.every((item) => item.changeFrequency === undefined)).toBe(true);
    expect(sitemap.every((item) => item.priority === undefined)).toBe(true);
  });

  it('contains no private, token, query or case-study URLs', () => {
    const urls = buildSitemap(production).map((item) => item.url);
    for (const url of urls) {
      expect(new URL(url).search).toBe('');
      expect(url).not.toContain('[token]');
      expect(url).not.toContain('/case-studies/');
      for (const prefix of forbidden) expect(url).not.toContain(prefix);
    }
  });

  it('returns an empty URL set on staging', () => {
    expect(buildSitemap({
      ...production,
      NEXT_PUBLIC_PREVENT_INDEXING: 'true',
    })).toEqual([]);
  });
});

