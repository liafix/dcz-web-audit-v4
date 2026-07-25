import { describe, expect, it } from 'vitest';
import { evaluateRules } from '@/lib/audit/rules';
import type { AuditEvidence } from '@/lib/audit/types';

const base: AuditEvidence = {
  sourceUrl: 'https://example.com', finalUrl: 'https://example.com/', httpStatus: 200,
  contentType: 'text/html', bodyBytes: 9000, durationMs: 500,
  responseHeaders: { 'content-encoding': 'br', 'strict-transport-security': 'max-age=31536000', 'content-security-policy': null, 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin' },
  fetchedAt: new Date(0).toISOString(),
  html: {
    title: 'Example company website title', titleLength: 29, metaDescription: 'A useful description for customers that clearly explains the service and next step.', metaDescriptionLength: 82,
    canonical: 'https://example.com/', metaRobots: null, language: 'sk', hasViewport: true, h1Count: 1,
    headings: [{ level: 1, text: 'Example company' }], headingHierarchyIssues: 0, links: [], ctaCount: 0, emptyInteractiveCount: 0,
    contactSignals: { hasPhone: false, hasEmail: false, hasContactLink: false },
    trustSignals: { hasPrivacyLink: false, hasAboutLink: false, hasCompanyIdentifier: false },
    revenueSignals: { hasBooking: false, hasOrder: false, hasQuoteRequest: false },
    formCount: 0, inputCount: 0, unlabelledInputs: 0, imageCount: 0, imagesWithoutAlt: 0,
    schemaTypes: [], scriptCount: 2, bodyTextLength: 1000, likelyJavascriptShell: false,
  },
  technicalFiles: {
    robots: { checked: true, available: false, status: 404, containsSitemap: false, blocksAll: false, discoveredSitemaps: [] },
    sitemap: { checked: true, available: false, status: 404, kind: null, url: null },
  },
  pageSpeed: { available: false, performance: null, accessibility: null, bestPractices: null, seo: null, fetchedAt: null, reason: 'not_configured' },
};

describe('evaluateRules v3', () => {
  it('marks absent HTML signals as NOT_DETECTED', () => {
    const result = evaluateRules(base);
    expect(result.findings.find((item) => item.id === 'primary-cta')?.status).toBe('NOT_DETECTED');
    expect(result.findings.find((item) => item.id === 'contact-path')?.status).toBe('NOT_DETECTED');
  });

  it('marks PageSpeed rules as unmeasured instead of pass when data is absent', () => {
    const result = evaluateRules(base);
    const pageSpeed = result.rules.find((rule) => rule.id === 'pagespeed-performance');
    expect(pageSpeed?.measured).toBe(false);
    expect(pageSpeed?.result).toBe('unknown');
  });

  it('flags meta robots noindex as a critical SEO failure', () => {
    const result = evaluateRules({ ...base, html: { ...base.html, metaRobots: 'noindex, follow' } });
    expect(result.findings.find((item) => item.id === 'meta-robots-indexing')?.severity).toBe('critical');
  });
});
