import type { MetadataRoute } from 'next';
import { canonicalUrl, isIndexingPrevented } from '@/lib/seo/config';

export const PRODUCTION_SITEMAP_PATHS = [
  '/',
  '/methodology',
  '/privacy',
  '/contact',
] as const;

export function buildSitemap(environment: NodeJS.ProcessEnv = process.env): MetadataRoute.Sitemap {
  if (isIndexingPrevented(environment)) return [];

  return [
    { url: canonicalUrl('/') },
    { url: canonicalUrl('/methodology'), lastModified: new Date('2026-07-26T00:00:00.000Z') },
    { url: canonicalUrl('/privacy'), lastModified: new Date('2026-07-25T00:00:00.000Z') },
    { url: canonicalUrl('/contact') },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
