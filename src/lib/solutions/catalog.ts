import type { SolutionId } from '@/lib/revenue/types';

export interface SolutionCatalogItem {
  id: SolutionId;
  title: string;
  summary: string;
  modules: string[];
  effortBand: 'focused' | 'growth' | 'platform';
  nextStepLabel: string;
}

export const SOLUTION_CATALOG: Record<SolutionId, SolutionCatalogItem> = {
  conversion_foundation: {
    id: 'conversion_foundation',
    title: 'Conversion Foundation',
    summary: 'Cielené odstránenie najväčších bariér titulnej stránky a kontaktnej cesty.',
    modules: ['Messaging a hodnotová ponuka', 'Dominantný CTA', 'Dôveryhodnostné prvky', 'Lead formulár', 'Základné SEO a meranie'],
    effortBand: 'focused',
    nextStepLabel: 'Overiť rozsah Conversion Foundation',
  },
  growth_funnel: {
    id: 'growth_funnel',
    title: 'Growth Funnel',
    summary: 'Kompletná cesta od návštevnosti cez kvalifikáciu až po merateľný obchodný dopyt.',
    modules: ['Konverzná architektúra', 'Kvalifikačný formulár', 'CRM/e-mail workflow', 'Rezervácia alebo demo flow', 'Analytics a optimalizácia'],
    effortBand: 'growth',
    nextStepLabel: 'Navrhnúť Growth Funnel',
  },
  revenue_platform: {
    id: 'revenue_platform',
    title: 'Revenue Platform',
    summary: 'Custom webová aplikácia prepájajúca predaj, rezervácie, platby, admin a automatizácie.',
    modules: ['Custom web aplikácia', 'Rezervácie/objednávky/platby', 'Admin a CRM', 'Automatizácie', 'Reporting a integrácie'],
    effortBand: 'platform',
    nextStepLabel: 'Prejsť možnosti Revenue Platform',
  },
};
