import type { Metadata } from 'next';
import { describe, expect, it } from 'vitest';
import {
  CASE_STUDY_SEO,
  CONTACT_SEO,
  HOME_SEO,
  METHODOLOGY_SEO,
  PRIVACY_SEO,
  buildPublicMetadata,
  renderedTitle,
} from '@/lib/seo/metadata';

const production = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_APP_URL: 'https://dczweb.com',
  NEXT_PUBLIC_PREVENT_INDEXING: 'false',
} as NodeJS.ProcessEnv;

const staging = {
  ...production,
  NEXT_PUBLIC_APP_URL: 'https://staging.example.test',
  NEXT_PUBLIC_PREVENT_INDEXING: 'true',
} as NodeJS.ProcessEnv;

function metadataRecord(metadata: Metadata) {
  return metadata as Metadata & {
    alternates?: { canonical?: string };
    openGraph?: { url?: string; title?: string; description?: string };
    robots?: { index?: boolean; follow?: boolean; nocache?: boolean };
  };
}

describe('public route metadata', () => {
  it.each([HOME_SEO, METHODOLOGY_SEO, PRIVACY_SEO, CONTACT_SEO])(
    'emits production canonical and matching Open Graph URL for $path',
    (page) => {
      const metadata = metadataRecord(buildPublicMetadata(page, production));
      expect(metadata.title).toEqual({ absolute: renderedTitle(page.title) });
      expect(metadata.description).toBe(page.description);
      expect(metadata.alternates?.canonical).toBe(
        page.path === '/' ? 'https://dczweb.com' : `https://dczweb.com${page.path}`,
      );
      expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
      expect(metadata.openGraph?.title).toBe(renderedTitle(page.title));
      expect(metadata.openGraph?.description).toBe(page.description);
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
    },
  );

  it.each([HOME_SEO, METHODOLOGY_SEO, PRIVACY_SEO, CONTACT_SEO])(
    'suppresses canonical and og:url on staging for $path',
    (page) => {
      const metadata = metadataRecord(buildPublicMetadata(page, staging));
      expect(metadata.alternates).toBeUndefined();
      expect(metadata.openGraph?.url).toBeUndefined();
      expect(metadata.robots).toMatchObject({ index: false, follow: false, nocache: true });
    },
  );

  it('keeps every current case study noindex and without canonical metadata', () => {
    for (const page of Object.values(CASE_STUDY_SEO)) {
      const metadata = metadataRecord(buildPublicMetadata(page, production));
      expect(page.indexable).toBe(false);
      expect(metadata.alternates).toBeUndefined();
      expect(metadata.openGraph?.url).toBeUndefined();
      expect(metadata.robots).toMatchObject({ index: false, follow: true, nocache: true });
      expect(metadata.title).toEqual({ absolute: renderedTitle(page.title) });
      expect(metadata.description).toBe(page.description);
    }
  });
});

