import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/env';

function preventIndexing(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
    process.env.NEXT_PUBLIC_PREVENT_INDEXING === 'true'
  );
}

export default function robots(): MetadataRoute.Robots {
  if (preventIndexing()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/methodology', '/privacy', '/contact', '/case-studies/'],
      disallow: ['/audit/', '/access/', '/admin/', '/api/', '/brief/', '/book/', '/unsubscribe/'],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
