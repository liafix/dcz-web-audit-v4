import type { MetadataRoute } from 'next';
import { CASE_STUDIES } from '@/content/case-studies';
import { appUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/methodology`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.7 },
    ...CASE_STUDIES.map((study) => ({
      url: `${base}/case-studies/${study.slug}`,
      changeFrequency: 'monthly' as const,
      priority: study.proofType === 'verified_client_result' || study.proofType === 'delivered_project' ? 0.75 : 0.55,
    })),
  ];
}
