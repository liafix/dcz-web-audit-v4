import type { CaseStudy, SolutionRecommendation } from '@/lib/revenue/types';

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function shell(content: string, unsubscribeUrl?: string): string {
  return `<!doctype html><html lang="sk"><body style="margin:0;background:#080b14;color:#e2e8f0;font-family:Arial,sans-serif"><div style="max-width:660px;margin:0 auto;padding:36px 20px"><p style="color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:.14em">DCZ Revenue Diagnostic</p>${content}<p style="margin-top:32px;color:#64748b;font-size:12px;line-height:1.6">Predbežná diagnostika pracuje s verejnými signálmi. Modelové scenáre nie sú garanciou výsledku.${unsubscribeUrl ? ` <a style="color:#94a3b8" href="${escapeHtml(unsubscribeUrl)}">Odhlásiť marketingové follow-upy</a>.` : ''}</p></div></body></html>`;
}

function button(label: string, url: string): string {
  return `<p style="margin:26px 0"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 20px;border-radius:10px;background:#4f8cff;color:white;text-decoration:none;font-weight:700">${escapeHtml(label)}</a></p>`;
}

export function roiReminderEmail(input: { origin: string; reportUrl: string }): string {
  return shell(`<h1 style="color:#fff">Doplňte obchodný kontext pre ${escapeHtml(input.origin)}</h1><p style="color:#cbd5e1;line-height:1.7">V reporte už vidíte prioritné bariéry. Doplnením niekoľkých ekonomických vstupov získate konzervatívny, realistický a rastový modelový scenár.</p>${button('Otvoriť ROI scenáre', `${input.reportUrl}#roi`)}`);
}

export function qualificationReminderEmail(input: { origin: string; reportUrl: string }): string {
  return shell(`<h1 style="color:#fff">Tri otázky spresnia odporúčanie pre ${escapeHtml(input.origin)}</h1><p style="color:#cbd5e1;line-height:1.7">Cieľ, rozhodovací termín a realistický investičný rozsah pomôžu systému odporučiť primeraný typ riešenia — bez automatického tlačenia najväčšieho projektu.</p>${button('Dokončiť kvalifikáciu', `${input.reportUrl}#qualification`)}`);
}

export function contextualSolutionEmail(input: { origin: string; reportUrl: string; bookingUrl: string; recommendation: SolutionRecommendation; caseStudy: CaseStudy | null; unsubscribeUrl: string }): string {
  const proof = input.caseStudy ? `<p style="color:#cbd5e1;line-height:1.7"><strong>Relevantný dôkaz:</strong> ${escapeHtml(input.caseStudy.title)} — ${escapeHtml(input.caseStudy.summary)}</p>` : '';
  return shell(`<h1 style="color:#fff">Odporúčaný smer: ${escapeHtml(input.recommendation.title)}</h1><p style="color:#cbd5e1;line-height:1.7">Pre ${escapeHtml(input.origin)} vychádza ako primeraný ďalší krok: ${escapeHtml(input.recommendation.summary)}</p>${proof}${button('Rezervovať diagnostický hovor', input.bookingUrl)}<p><a style="color:#c4b5fd" href="${escapeHtml(input.reportUrl)}">Vrátiť sa k celému reportu →</a></p>`, input.unsubscribeUrl);
}

export function closeLoopEmail(input: { origin: string; bookingUrl: string; unsubscribeUrl: string }): string {
  return shell(`<h1 style="color:#fff">Má zmysel pokračovať s výsledkom pre ${escapeHtml(input.origin)}?</h1><p style="color:#cbd5e1;line-height:1.7">Report zostáva k dispozícii počas svojej platnosti. Keď chcete overiť, ktoré bariéry majú reálnu obchodnú prioritu, rezervujte krátku diagnostiku. Keď to teraz nie je aktuálne, nie je potrebné nič robiť.</p>${button('Rezervovať 20-min diagnostiku', input.bookingUrl)}`, input.unsubscribeUrl);
}
