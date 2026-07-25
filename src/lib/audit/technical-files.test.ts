import { describe, expect, it } from 'vitest';
import { parseRobots, sitemapKind } from '@/lib/audit/technical-files';

describe('technical file parsing', () => {
  it('checks Disallow only in the wildcard group', () => {
    const result = parseRobots(`User-agent: BadBot
Disallow: /

User-agent: *
Disallow: /private
Sitemap: https://example.com/sitemap.xml`);
    expect(result.blocksAll).toBe(false);
    expect(result.sitemaps).toEqual(['https://example.com/sitemap.xml']);
  });

  it('detects a full wildcard block', () => {
    expect(parseRobots(`User-agent: *
Disallow: /`).blocksAll).toBe(true);
  });

  it('recognizes sitemap XML roots', () => {
    expect(sitemapKind('<?xml version="1.0"?><urlset></urlset>')).toBe('urlset');
    expect(sitemapKind('<sitemapindex></sitemapindex>')).toBe('sitemapindex');
    expect(sitemapKind('<html></html>')).toBeNull();
  });
});
