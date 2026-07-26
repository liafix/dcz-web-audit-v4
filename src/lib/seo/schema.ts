import type { MethodologyFaqItem } from '@/lib/seo/methodology';
import {
  CANONICAL_ORIGIN,
  SITE_LANGUAGE,
  SITE_NAME,
  canonicalUrl,
} from '@/lib/seo/config';
import {
  CONTACT_SEO,
  HOME_SEO,
  METHODOLOGY_SEO,
  PRIVACY_SEO,
  renderedTitle,
} from '@/lib/seo/metadata';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export const ENTITY_IDS = {
  organization: `${CANONICAL_ORIGIN}/#organization`,
  brand: `${CANONICAL_ORIGIN}/#brand`,
  website: `${CANONICAL_ORIGIN}/#website`,
  application: `${CANONICAL_ORIGIN}/#webapplication`,
  service: `${CANONICAL_ORIGIN}/#service`,
  agencyWebsite: 'https://dcz.sk/#website',
} as const;

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const code = character.charCodeAt(0).toString(16).padStart(4, '0');
    return `\\u${code}`;
  });
}

export function breadcrumbListSchema(items: readonly BreadcrumbItem[], pagePath: string) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(pagePath)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.href),
    })),
  };
}

export function faqPageSchema(items: readonly MethodologyFaqItem[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${canonicalUrl('/methodology')}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function homePageGraph() {
  const pageUrl = canonicalUrl('/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ENTITY_IDS.organization,
        name: 'AesDC s. r. o.',
        legalName: 'AesDC s. r. o.',
        url: 'https://dcz.sk/',
        email: 'info@dcz.sk',
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'IČO',
          value: '55408575',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Štvrť SNP 132/23',
          postalCode: '914 51',
          addressLocality: 'Trenčianske Teplice',
          addressCountry: 'SK',
        },
        subjectOf: { '@id': ENTITY_IDS.agencyWebsite },
      },
      {
        '@type': 'Brand',
        '@id': ENTITY_IDS.brand,
        name: SITE_NAME,
      },
      {
        '@type': 'WebSite',
        '@id': ENTITY_IDS.agencyWebsite,
        name: 'DCZ.sk',
        url: 'https://dcz.sk/',
        publisher: { '@id': ENTITY_IDS.organization },
        inLanguage: SITE_LANGUAGE,
      },
      {
        '@type': 'WebSite',
        '@id': ENTITY_IDS.website,
        name: SITE_NAME,
        url: pageUrl,
        description: HOME_SEO.description,
        inLanguage: SITE_LANGUAGE,
        publisher: { '@id': ENTITY_IDS.organization },
        about: { '@id': ENTITY_IDS.brand },
      },
      {
        '@type': 'WebApplication',
        '@id': ENTITY_IDS.application,
        name: SITE_NAME,
        url: pageUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: SITE_LANGUAGE,
        description:
          'Webová aplikácia, ktorá bezpečne vyhodnocuje verejné signály titulnej stránky a základných technických súborov.',
        brand: { '@id': ENTITY_IDS.brand },
        provider: { '@id': ENTITY_IDS.organization },
      },
      {
        '@type': 'Service',
        '@id': ENTITY_IDS.service,
        name: 'Predbežná diagnostika webu DCZ WebAudit',
        serviceType: 'Predbežná automatizovaná diagnostika verejných signálov webu',
        description:
          'Diagnostická služba, ktorá oddeľuje uložené dôkazy, obchodnú interpretáciu, pokrytie merania a limity automatizácie.',
        provider: { '@id': ENTITY_IDS.organization },
        isRelatedTo: { '@id': ENTITY_IDS.application },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: renderedTitle(HOME_SEO.title),
        description: HOME_SEO.description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: { '@id': ENTITY_IDS.website },
        about: [{ '@id': ENTITY_IDS.application }, { '@id': ENTITY_IDS.service }],
        mainEntity: { '@id': ENTITY_IDS.service },
      },
    ],
  };
}

export function methodologyPageGraph(
  breadcrumbs: readonly BreadcrumbItem[],
  faqItems: readonly MethodologyFaqItem[],
) {
  const pageUrl = canonicalUrl('/methodology');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: renderedTitle(METHODOLOGY_SEO.title),
        description: METHODOLOGY_SEO.description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: { '@id': ENTITY_IDS.website },
        about: [{ '@id': ENTITY_IDS.application }, { '@id': ENTITY_IDS.service }],
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        dateModified: '2026-07-26',
      },
      breadcrumbListSchema(breadcrumbs, '/methodology'),
      faqPageSchema(faqItems),
    ],
  };
}

export function privacyPageGraph(breadcrumbs: readonly BreadcrumbItem[]) {
  const pageUrl = canonicalUrl('/privacy');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: renderedTitle(PRIVACY_SEO.title),
        description: PRIVACY_SEO.description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: { '@id': ENTITY_IDS.website },
        about: { '@id': ENTITY_IDS.organization },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        dateModified: '2026-07-25',
      },
      breadcrumbListSchema(breadcrumbs, '/privacy'),
    ],
  };
}

export function contactPageGraph(breadcrumbs: readonly BreadcrumbItem[]) {
  const pageUrl = canonicalUrl('/contact');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: renderedTitle(CONTACT_SEO.title),
        description: CONTACT_SEO.description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: { '@id': ENTITY_IDS.website },
        mainEntity: { '@id': ENTITY_IDS.organization },
        relatedLink: 'https://dcz.sk/',
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      breadcrumbListSchema(breadcrumbs, '/contact'),
    ],
  };
}

