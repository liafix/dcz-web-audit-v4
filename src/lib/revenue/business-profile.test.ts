import { describe, expect, it } from 'vitest';
import { inferBusinessProfile } from '@/lib/revenue/business-profile';
import type { AuditEvidence } from '@/lib/audit/types';

function evidence(text: string, options?: { booking?: boolean; order?: boolean; quote?: boolean; generic?: boolean }): AuditEvidence {
  return {
    sourceUrl: 'https://example.sk', finalUrl: 'https://example.sk/', httpStatus: 200, contentType: 'text/html', bodyBytes: 5000, durationMs: 300,
    responseHeaders: { 'content-encoding': 'br', 'strict-transport-security': 'max-age=31536000', 'content-security-policy': null, 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin' }, fetchedAt: new Date(0).toISOString(),
    html: { title: text, titleLength: text.length, metaDescription: text, metaDescriptionLength: text.length, canonical: 'https://example.sk/', metaRobots: null, language: 'sk', hasViewport: true, h1Count: 1, headings: [{ level: 1, text }], headingHierarchyIssues: 0, links: options?.generic ? [{ text: 'Kontakt', href: '/kontakt' }] : [{ text: 'Rezervovať demo', href: '/demo' }], ctaCount: 1, emptyInteractiveCount: 0, contactSignals: { hasPhone: false, hasEmail: true, hasContactLink: true }, trustSignals: { hasPrivacyLink: true, hasAboutLink: true, hasCompanyIdentifier: true }, revenueSignals: { hasBooking: options?.booking ?? false, hasOrder: options?.order ?? false, hasQuoteRequest: options?.quote ?? true }, formCount: 1, inputCount: 2, unlabelledInputs: 0, imageCount: 1, imagesWithoutAlt: 0, schemaTypes: options?.generic ? [] : ['SoftwareApplication'], scriptCount: 2, bodyTextLength: 1200, likelyJavascriptShell: false },
    technicalFiles: { robots: { checked: true, available: true, status: 200, containsSitemap: true, blocksAll: false, discoveredSitemaps: ['https://example.sk/sitemap.xml'] }, sitemap: { checked: true, available: true, status: 200, kind: 'urlset', url: 'https://example.sk/sitemap.xml' } },
    pageSpeed: { available: false, performance: null, accessibility: null, bestPractices: null, seo: null, fetchedAt: null, reason: 'not_configured' },
  };
}

describe('inferBusinessProfile', () => {
  it('identifies a SaaS demo-sales profile from stored signals', () => {
    const result = inferBusinessProfile(evidence('B2B SaaS cloud platforma s API, integráciami a demo konzultáciou'));
    expect(result.vertical).toBe('b2b_saas');
    expect(result.businessModel).toBe('demo_sales');
    expect(result.evidence.length).toBeGreaterThan(0);
  });
  it('keeps low-evidence profiles explicit instead of inventing a vertical', () => {
    const result = inferBusinessProfile(evidence('Vitajte na našej stránke', { quote: false, generic: true }));
    expect(result.vertical).toBe('unknown');
  });
});
