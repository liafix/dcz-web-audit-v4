import type { Metadata } from 'next';
import {
  SITE_LOCALE,
  SITE_NAME,
  canonicalUrl,
  isIndexingPrevented,
} from '@/lib/seo/config';

export interface PublicPageSeo {
  path: string;
  title: string;
  description: string;
  indexable?: boolean;
}

export const HOME_SEO: PublicPageSeo = {
  path: '/',
  title: 'Predbežný audit webstránky',
  description:
    'Predbežná automatizovaná diagnostika verejných signálov titulnej stránky. Odhalí technické, SEO, dôveryhodnostné a konverzné bariéry bez zásahu do webu.',
};

export const METHODOLOGY_SEO: PublicPageSeo = {
  path: '/methodology',
  title: 'Metodika auditu webstránky',
  description:
    'Ako DCZ WebAudit bezpečne analyzuje verejné signály titulnej stránky, vyhodnocuje dôkazy a skóre a vysvetľuje limity automatizovanej diagnostiky.',
};

export const PRIVACY_SEO: PublicPageSeo = {
  path: '/privacy',
  title: 'Ochrana súkromia',
  description:
    'Ako AesDC s. r. o. spracúva údaje pri DCZ WebAudit: účely, doby uchovávania, príjemcovia, cookies, bezpečný prístup a práva používateľov.',
};

export const CONTACT_SEO: PublicPageSeo = {
  path: '/contact',
  title: 'Kontakt a ďalší postup',
  description:
    'Kontaktujte DCZ k výsledku webového auditu. Prejdeme zistenia, obchodný kontext a primeraný ďalší krok bez sľubov výsledkov.',
};

export const CASE_STUDY_SEO: Record<string, PublicPageSeo> = {
  'fitness-clenstvo-a-platby': {
    path: '/case-studies/fitness-clenstvo-a-platby',
    title: 'Fitness web: členstvo a online platby',
    description:
      'Príklad dodaného riešenia, ktoré prepojilo ponuku členstva, programy a externé platobné odkazy v jasnej mobilnej konverznej ceste.',
    indexable: false,
  },
  'b2b-saas-value-portal': {
    path: '/case-studies/b2b-saas-value-portal',
    title: 'B2B SaaS value portal – modelový koncept',
    description:
      'Transparentne označený koncept B2B funnelu od diagnostiky cez executive podklad po kvalifikovaný obchodný follow-up.',
    indexable: false,
  },
  'developerska-revenue-platforma': {
    path: '/case-studies/developerska-revenue-platforma',
    title: 'Revenue platforma pre developera – koncept',
    description:
      'Transparentne označený koncept dostupnosti jednotiek, rezervácie, leadov a obchodného adminu bez tvrdení o klientskom výsledku.',
    indexable: false,
  },
  'klientske-centrum-profesionalnych-sluzieb': {
    path: '/case-studies/klientske-centrum-profesionalnych-sluzieb',
    title: 'Klientske centrum pre profesionálne služby',
    description:
      'Príklad dodaného klientskeho rozhrania a kontaktnej cesty pre profesionálne služby bez neoverených tvrdení o výnosoch.',
    indexable: false,
  },
};

const socialImage = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'DCZ WebAudit – predbežná diagnostika verejných signálov webu',
};

export function renderedTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function buildPublicMetadata(
  page: PublicPageSeo,
  environment: NodeJS.ProcessEnv = process.env,
): Metadata {
  const prevented = isIndexingPrevented(environment);
  const indexable = page.indexable !== false && !prevented;
  const title = renderedTitle(page.title);
  const url = indexable ? canonicalUrl(page.path) : undefined;

  return {
    title: { absolute: title },
    description: page.description,
    ...(url ? { alternates: { canonical: url } } : {}),
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: prevented ? false : true, nocache: true },
    openGraph: {
      type: 'website',
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title,
      description: page.description,
      ...(url ? { url } : {}),
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      images: [socialImage],
    },
  };
}

