import { describe, expect, it } from 'vitest';
import { METHODOLOGY_FAQ } from '@/lib/seo/methodology';
import {
  ENTITY_IDS,
  breadcrumbListSchema,
  contactPageGraph,
  faqPageSchema,
  homePageGraph,
  methodologyPageGraph,
  privacyPageGraph,
  serializeJsonLd,
  type BreadcrumbItem,
} from '@/lib/seo/schema';

const methodologyBreadcrumbs: readonly BreadcrumbItem[] = [
  { name: 'Domov', href: '/' },
  { name: 'Metodika', href: '/methodology' },
];
const privacyBreadcrumbs: readonly BreadcrumbItem[] = [
  { name: 'Domov', href: '/' },
  { name: 'Ochrana súkromia', href: '/privacy' },
];
const contactBreadcrumbs: readonly BreadcrumbItem[] = [
  { name: 'Domov', href: '/' },
  { name: 'Kontakt', href: '/contact' },
];

describe('structured data', () => {
  const graphs = [
    homePageGraph(),
    methodologyPageGraph(methodologyBreadcrumbs, METHODOLOGY_FAQ),
    privacyPageGraph(privacyBreadcrumbs),
    contactPageGraph(contactBreadcrumbs),
  ];

  it('serializes every graph as valid escaped JSON-LD', () => {
    for (const graph of graphs) {
      const serialized = serializeJsonLd(graph);
      expect(() => JSON.parse(serialized)).not.toThrow();
      expect(serialized).not.toContain('<');
      expect(serialized).not.toContain('>');
      expect(serialized).not.toContain('&');
    }
  });

  it('uses stable and distinct organization, brand, application and service relationships', () => {
    const graph = homePageGraph()['@graph'];
    const byId = new Map(graph.map((entity) => [entity['@id'], entity]));
    expect(byId.get(ENTITY_IDS.organization)?.['@type']).toBe('Organization');
    expect(byId.get(ENTITY_IDS.brand)?.['@type']).toBe('Brand');
    expect(byId.get(ENTITY_IDS.application)?.['@type']).toBe('WebApplication');
    expect(byId.get(ENTITY_IDS.service)?.['@type']).toBe('Service');
    expect(byId.get(ENTITY_IDS.application)?.provider).toEqual({ '@id': ENTITY_IDS.organization });
    expect(byId.get(ENTITY_IDS.service)?.provider).toEqual({ '@id': ENTITY_IDS.organization });
    expect(byId.get(ENTITY_IDS.service)?.isRelatedTo).toEqual({ '@id': ENTITY_IDS.application });
    expect(byId.get(ENTITY_IDS.agencyWebsite)?.name).toBe('DCZ.sk');
  });

  it('contains no unsupported or private schema fields', () => {
    const serialized = JSON.stringify(graphs);
    for (const forbidden of [
      'aggregateRating',
      'review',
      'offers',
      'price',
      'founder',
      'employee',
      'award',
      'sameAs',
      'areaServed',
      'customer',
      'audit_',
      '[token]',
      'reportUrl',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).not.toMatch(/https:\/\/dczweb\.com\/(?:audit|access|admin|api|brief|book|unsubscribe)\//);
  });

  it('builds FAQ schema from the exact visible FAQ source', () => {
    const faq = faqPageSchema(METHODOLOGY_FAQ);
    expect(faq.mainEntity).toHaveLength(METHODOLOGY_FAQ.length);
    expect(faq.mainEntity.map((item) => item.name)).toEqual(
      METHODOLOGY_FAQ.map((item) => item.question),
    );
    expect(faq.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(
      METHODOLOGY_FAQ.map((item) => item.answer),
    );
  });

  it('builds breadcrumbs from the exact visible hierarchy without a fabricated parent', () => {
    const schema = breadcrumbListSchema(methodologyBreadcrumbs, '/methodology');
    expect(schema.itemListElement.map((item) => item.name)).toEqual(['Domov', 'Metodika']);
    expect(JSON.stringify(schema)).not.toContain('/case-studies');
  });
});

