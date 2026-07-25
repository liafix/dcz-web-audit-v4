import type { AuditEvidence } from '@/lib/audit/types';
import type { BusinessModel, BusinessProfile, BusinessVertical } from '@/lib/revenue/types';

const VERTICAL_TERMS: Record<Exclude<BusinessVertical, 'unknown'>, string[]> = {
  b2b_saas: ['saas', 'software', 'platforma', 'platform', 'demo', 'trial', 'integrácia', 'integration', 'api', 'cloud'],
  developer_real_estate: ['developer', 'byty', 'apartmány', 'rezidencia', 'nehnuteľnosť', 'reality', 'pôdorys', 'projekt bývania'],
  hotel_hospitality: ['hotel', 'rezort', 'resort', 'ubytovanie', 'izba', 'pobyt', 'wellness pobyt', 'booking'],
  fitness_wellness: ['fitness', 'gym', 'fitko', 'tréning', 'členstvo', 'permanentka', 'wellness', 'spinning'],
  clinic_health: ['klinika', 'ambulancia', 'lekár', 'dent', 'zub', 'terapia', 'vyšetrenie', 'pacient'],
  professional_services: ['účtovníctvo', 'advokát', 'poradenstvo', 'consulting', 'agentúra', 'služby pre firmy', 'konzultácia'],
  ecommerce: ['eshop', 'e-shop', 'košík', 'produkt', 'objednať', 'shop', 'doprava', 'skladom'],
  local_service: ['servis', 'salón', 'reštaurácia', 'remeslo', 'oprava', 'lokálne služby', 'prevádzka'],
};

function corpus(evidence: AuditEvidence): string {
  return [
    evidence.html.title,
    evidence.html.metaDescription,
    ...evidence.html.headings.map((heading) => heading.text),
    ...evidence.html.links.map((link) => link.text),
    ...evidence.html.schemaTypes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('sk-SK');
}

function inferVertical(text: string): { vertical: BusinessVertical; confidence: number; hits: string[] } {
  const scored = Object.entries(VERTICAL_TERMS).map(([vertical, terms]) => {
    const hits = terms.filter((term) => text.includes(term));
    return { vertical: vertical as Exclude<BusinessVertical, 'unknown'>, hits, score: hits.length };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) return { vertical: 'unknown', confidence: 25, hits: [] };
  const second = scored[1]?.score ?? 0;
  const confidence = Math.min(92, 52 + best.score * 10 + Math.max(0, best.score - second) * 5);
  return { vertical: best.vertical, confidence, hits: best.hits.slice(0, 5) };
}

function inferBusinessModel(evidence: AuditEvidence, text: string): { model: BusinessModel; confidence: number; evidence: string[] } {
  const signals: Array<{ model: BusinessModel; score: number; evidence: string[] }> = [
    {
      model: 'booking',
      score: (evidence.html.revenueSignals.hasBooking ? 5 : 0) + (/(rezerv|booking|termín)/i.test(text) ? 2 : 0),
      evidence: evidence.html.revenueSignals.hasBooking ? ['Na stránke bol zistený rezervačný signál.'] : [],
    },
    {
      model: 'ecommerce',
      score: (evidence.html.revenueSignals.hasOrder ? 5 : 0) + (/(košík|objednať|shop|produkt)/i.test(text) ? 2 : 0),
      evidence: evidence.html.revenueSignals.hasOrder ? ['Na stránke bol zistený objednávkový signál.'] : [],
    },
    {
      model: 'demo_sales',
      score: (/(demo|trial|ukážk|konzultáci)/i.test(text) ? 5 : 0) + (evidence.html.revenueSignals.hasQuoteRequest ? 2 : 0),
      evidence: /(demo|trial|ukážk)/i.test(text) ? ['Text stránky obsahuje demo alebo trial signál.'] : [],
    },
    {
      model: 'subscription',
      score: /(predplat|subscription|mesačné členstvo|členstvo)/i.test(text) ? 5 : 0,
      evidence: /(predplat|subscription|mesačné členstvo|členstvo)/i.test(text) ? ['Text stránky obsahuje predplatné alebo členstvo.'] : [],
    },
    {
      model: 'lead_generation',
      score: (evidence.html.formCount > 0 ? 2 : 0) + (evidence.html.contactSignals.hasContactLink ? 2 : 0) + (evidence.html.revenueSignals.hasQuoteRequest ? 2 : 0),
      evidence: evidence.html.formCount > 0 ? ['Na stránke bol zistený formulár.'] : [],
    },
  ];
  const best = signals.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score === 0) {
    return { model: evidence.html.bodyTextLength > 300 ? 'information_only' : 'unknown', confidence: 34, evidence: [] };
  }
  return { model: best.model, confidence: Math.min(92, 48 + best.score * 8), evidence: best.evidence };
}

export function inferBusinessProfile(evidence: AuditEvidence): BusinessProfile {
  const text = corpus(evidence);
  const vertical = inferVertical(text);
  const model = inferBusinessModel(evidence, text);
  const evidenceItems = [
    ...vertical.hits.map((term) => `Vertikálny signál: „${term}“`),
    ...model.evidence,
  ];
  return {
    vertical: vertical.vertical,
    verticalConfidence: vertical.confidence,
    businessModel: model.model,
    businessModelConfidence: model.confidence,
    evidence: evidenceItems.slice(0, 8),
  };
}
