import { describe, expect, it } from 'vitest';
import { buildRobots } from '@/app/robots';

const production = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_PREVENT_INDEXING: 'false',
} as NodeJS.ProcessEnv;

describe('robots metadata route', () => {
  it('publishes the canonical sitemap and protects private route groups in production', () => {
    const result = buildRobots(production);
    expect(result.sitemap).toBe('https://dczweb.com/sitemap.xml');
    expect(result.rules).toEqual({
      userAgent: '*',
      allow: ['/', '/audit/start'],
      disallow: ['/audit/', '/access/', '/admin/', '/api/', '/brief/', '/book/', '/unsubscribe/'],
    });
  });

  it('blocks all crawling and omits the sitemap declaration on staging', () => {
    const result = buildRobots({
      ...production,
      NEXT_PUBLIC_PREVENT_INDEXING: 'true',
    });
    expect(result).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    expect(result.sitemap).toBeUndefined();
  });
});

