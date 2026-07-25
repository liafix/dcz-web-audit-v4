import * as cheerio from 'cheerio';
import type { HtmlEvidence, LinkSignal } from '@/lib/audit/types';

const CTA_PATTERN = /(?:objednať|rezervovať|kontaktovať|získať|kúpiť|vyžiadať|cenov|konzultáci|audit|ponuku|demo|book|reserve|contact|get started|request|buy|shop)/i;
const BOOKING_PATTERN = /(?:rezerv|booking|book now|termín|appointment)/i;
const ORDER_PATTERN = /(?:objedn|order|shop|košík|cart|checkout|kúpiť|buy)/i;
const QUOTE_PATTERN = /(?:cenov|quote|ponuk|estimate|konzultáci|consultation)/i;
const PRIVACY_PATTERN = /(?:privacy|súkrom|ochrana osobných|gdpr)/i;
const ABOUT_PATTERN = /(?:o nás|about|firma|spoločnosť|team|tím)/i;
const CONTACT_PATTERN = /(?:kontakt|contact|napíšte|zavolajte)/i;

function text(value: string, maxLength = 240): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function collectSchemaTypes($: cheerio.CheerioAPI): string[] {
  const types = new Set<string>();
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      const visit = (value: unknown): void => {
        if (Array.isArray(value)) {
          value.forEach(visit);
          return;
        }
        if (!value || typeof value !== 'object') return;
        const object = value as Record<string, unknown>;
        const typeValue = object['@type'];
        if (typeof typeValue === 'string') types.add(typeValue);
        if (Array.isArray(typeValue)) {
          for (const item of typeValue) if (typeof item === 'string') types.add(item);
        }
        for (const child of Object.values(object)) visit(child);
      };
      visit(parsed);
    } catch {
      // Malformed third-party JSON-LD is recorded as absence, not a parser failure.
    }
  });
  return [...types].slice(0, 30);
}

export function extractHtmlSignals(html: string, baseUrl: string): HtmlEvidence {
  const $ = cheerio.load(html);
  const schemaTypes = collectSchemaTypes($);
  const scriptCount = $('script[src], script:not([type="application/ld+json"])').length;
  $('script, style, noscript, template').remove();

  const titleValue = text($('title').first().text()) || null;
  const description = text($('meta[name="description" i]').first().attr('content') ?? '') || null;
  const canonicalRaw = $('link[rel="canonical" i]').first().attr('href') ?? null;
  let canonical: string | null = null;
  if (canonicalRaw) {
    try {
      canonical = new URL(canonicalRaw, baseUrl).toString();
    } catch {
      canonical = canonicalRaw.slice(0, 500);
    }
  }

  const links: LinkSignal[] = [];
  $('a[href]').each((_, element) => {
    if (links.length >= 120) return;
    const hrefRaw = $(element).attr('href');
    if (!hrefRaw || hrefRaw.startsWith('#') || hrefRaw.startsWith('javascript:')) return;
    try {
      links.push({
        text: text($(element).text() || $(element).attr('aria-label') || ''),
        href: new URL(hrefRaw, baseUrl).toString().slice(0, 700),
      });
    } catch {
      // Invalid third-party links must not abort the audit.
    }
  });

  const headings: Array<{ level: number; text: string }> = [];
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    if (headings.length >= 80) return;
    const tagName = element.tagName.toLowerCase();
    headings.push({ level: Number(tagName.slice(1)), text: text($(element).text()) });
  });

  let inputCount = 0;
  let unlabelledInputs = 0;
  $('input:not([type="hidden"]), select, textarea').each((_, element) => {
    inputCount += 1;
    const field = $(element);
    const id = field.attr('id');
    const hasForLabel = id
      ? $('label').toArray().some((label) => $(label).attr('for') === id)
      : false;
    const hasLabel = Boolean(
      field.attr('aria-label') ||
        field.attr('aria-labelledby') ||
        field.closest('label').length ||
        hasForLabel,
    );
    if (!hasLabel) unlabelledInputs += 1;
  });

  const rawBodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const bodyText = rawBodyText.slice(0, 100_000).toLowerCase();
  const bodyTextLength = rawBodyText.length;
  const imageCount = $('img').length;
  const imagesWithoutAlt = $('img').filter((_, element) => {
    const alt = $(element).attr('alt');
    return alt === undefined;
  }).length;

  const combinedLinks = links.map((link) => `${link.text} ${link.href}`).join(' ');
  const allSignals = `${bodyText} ${combinedLinks}`;
  const likelyJavascriptShell =
    scriptCount >= 4 && bodyTextLength < 350 && headings.length < 2 && links.length < 4;
  let headingHierarchyIssues = 0;
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index]!.level - headings[index - 1]!.level > 1) headingHierarchyIssues += 1;
  }
  const emptyInteractiveCount = $('button, a').filter((_, element) => {
    const visibleText = text($(element).text());
    const accessibleName = text($(element).attr('aria-label') ?? $(element).attr('title') ?? '');
    const hasImageAlt = Boolean($(element).find('img[alt]').filter((__, image) => text($(image).attr('alt') ?? '').length > 0).length);
    return !visibleText && !accessibleName && !hasImageAlt;
  }).length;

  return {
    title: titleValue,
    titleLength: titleValue?.length ?? null,
    metaDescription: description,
    metaDescriptionLength: description?.length ?? null,
    canonical,
    metaRobots: text($('meta[name="robots" i]').first().attr('content') ?? '') || null,
    language: text($('html').attr('lang') ?? '') || null,
    hasViewport: Boolean($('meta[name="viewport" i]').attr('content')),
    h1Count: $('h1').length,
    headings,
    headingHierarchyIssues,
    links,
    ctaCount: links.filter((link) => CTA_PATTERN.test(`${link.text} ${link.href}`)).length,
    emptyInteractiveCount,
    contactSignals: {
      hasPhone:
        links.some((link) => link.href.startsWith('tel:')) ||
        /(?:\+421|0\d{2})[\s-]?\d{3}[\s-]?\d{3}/.test(bodyText),
      hasEmail:
        links.some((link) => link.href.startsWith('mailto:')) ||
        /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(bodyText),
      hasContactLink: CONTACT_PATTERN.test(combinedLinks),
    },
    trustSignals: {
      hasPrivacyLink: PRIVACY_PATTERN.test(combinedLinks),
      hasAboutLink: ABOUT_PATTERN.test(combinedLinks),
      hasCompanyIdentifier:
        /(?:ičo|company id|identification number|s\.\s*r\.\s*o\.|a\.\s*s\.)/i.test(bodyText),
    },
    revenueSignals: {
      hasBooking: BOOKING_PATTERN.test(allSignals),
      hasOrder: ORDER_PATTERN.test(allSignals),
      hasQuoteRequest: QUOTE_PATTERN.test(allSignals),
    },
    formCount: $('form').length,
    inputCount,
    unlabelledInputs,
    imageCount,
    imagesWithoutAlt,
    schemaTypes,
    scriptCount,
    bodyTextLength,
    likelyJavascriptShell,
  };
}
