import type { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN, isIndexingPrevented } from '@/lib/seo/config';

export function buildRobots(environment: NodeJS.ProcessEnv = process.env): MetadataRoute.Robots {
  if (isIndexingPrevented(environment)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/audit/start'],
      disallow: ['/audit/', '/access/', '/admin/', '/api/', '/brief/', '/book/', '/unsubscribe/'],
    },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
