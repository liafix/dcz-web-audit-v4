import type { AuditReport } from '@/lib/audit/types';
import type { BusinessProfile, ExecutiveSummary, MoneyLeak } from '@/lib/revenue/types';

const modelOpportunity: Record<BusinessProfile['businessModel'], string> = {
  lead_generation: 'zjednodušiť cestu od hodnoty ponuky ku kvalifikovanému dopytu',
  booking: 'skrátiť cestu od záujmu k rezervácii a následnému potvrdeniu',
  ecommerce: 'odstrániť trenie medzi produktovým záujmom a objednávkou',
  demo_sales: 'prepojiť hodnotu produktu s jasnou demo alebo konzultačnou cestou',
  subscription: 'jasne vysvetliť členstvo a viesť návštevníka k aktivácii',
  information_only: 'premeniť prezentačný obsah na merateľný obchodný ďalší krok',
  unknown: 'definovať jeden merateľný ďalší krok, ktorý zodpovedá obchodnému cieľu',
};

export function buildExecutiveSummary(
  report: Pick<AuditReport, 'overallScore' | 'overallCoverage' | 'confidence' | 'findings' | 'strengths'>,
  profile: BusinessProfile,
  leaks: MoneyLeak[],
): ExecutiveSummary {
  const primary = leaks.find((leak) => leak.status !== 'UNKNOWN') ?? leaks[0];
  const headline = report.overallCoverage < 40
    ? 'Dostupné dáta sú obmedzené; manuálna kontrola je potrebná pred zásadným rozhodnutím.'
    : primary
      ? `Najväčšia zistená bariéra je: ${primary.title.toLocaleLowerCase('sk-SK')}.`
      : 'Titulná stránka má použiteľný základ, no ďalší rast vyžaduje overenie obchodnej cesty.';
  const firstInvestment = primary?.category === 'traffic_acquisition'
    ? { title: 'Indexácia a akvizičný základ', reason: 'Najskôr odstráňte bariéry, ktoré môžu obmedziť prístup relevantnej návštevnosti.' }
    : primary?.category === 'trust'
      ? { title: 'Dôvera pred konverziou', reason: 'Pred rozširovaním trafficu je vhodné posilniť dôkazy, identitu a istotu návštevníka.' }
      : primary?.category === 'transaction'
        ? { title: 'Priama obchodná cesta', reason: 'Najvyššiu prioritu má merateľný krok k rezervácii, objednávke alebo kvalifikovanému dopytu.' }
        : { title: 'Konverzná cesta titulnej stránky', reason: 'Zjednoťte hodnotovú ponuku, CTA a kontaktný krok do jedného zrozumiteľného funnelu.' };

  return {
    headline,
    primaryRisk: {
      title: primary?.title ?? 'Obchodný krok nie je dostatočne overený',
      explanation: primary?.mechanism ?? 'Automatická diagnostika nenašla dostatok dôkazov na spoľahlivý záver.',
      evidenceIds: primary?.evidenceIds ?? [],
    },
    primaryOpportunity: {
      title: 'Najväčšia príležitosť',
      explanation: `Pre tento typ webu je príležitosťou ${modelOpportunity[profile.businessModel]}.`,
    },
    firstRecommendedInvestment: firstInvestment,
    decisionConfidence: Math.min(report.confidence, Math.max(20, report.overallCoverage)),
  };
}
