export interface MethodologyFaqItem {
  question: string;
  answer: string;
}

export const METHODOLOGY_FAQ: readonly MethodologyFaqItem[] = [
  {
    question: 'Čo je DCZ WebAudit?',
    answer:
      'DCZ WebAudit je predbežná automatizovaná diagnostika verejne dostupných signálov titulnej stránky, robots.txt, sitemap.xml a voliteľných PageSpeed kategórií.',
  },
  {
    question: 'Kontroluje audit celý web?',
    answer:
      'Nie. Diagnostika sa sústreďuje na titulnú stránku a základné technické súbory. Nevykonáva kompletný crawl ani browser rendering celého webu.',
  },
  {
    question: 'Zasahuje audit do analyzovaného webu?',
    answer:
      'Nie. Systém sa neprihlasuje, neodosiela formuláre, nevykonáva platby a nemení obsah kontrolovaného webu.',
  },
  {
    question: 'Čo znamená obchodná bariéra?',
    answer:
      'Je to verejne pozorovaný signál alebo kombinácia signálov, ktoré môžu brzdiť pochopenie ponuky, dôveru, kontakt, rezerváciu alebo transakciu. Nie je to automaticky dokázaná finančná strata.',
  },
  {
    question: 'Je výsledok plnohodnotný SEO, UX, právny alebo bezpečnostný audit?',
    answer:
      'Nie. Ide o prvotnú diagnostiku a prioritizáciu. Dôležité rozhodnutia treba doplniť manuálnou kontrolou príslušného odborníka.',
  },
  {
    question: 'Ako sa počíta skóre, pokrytie a confidence?',
    answer:
      'Skóre vychádza iba z aplikovateľných nameraných pravidiel. Neznáme alebo nedostupné údaje znižujú pokrytie a confidence, nie automaticky výsledné skóre.',
  },
  {
    question: 'Je ROI scenár garanciou?',
    answer:
      'Nie. ROI scenáre vznikajú iba zo vstupov zadaných používateľom a slúžia ako orientačný rozhodovací model, nie ako garancia alebo výpočet ušlých tržieb.',
  },
  {
    question: 'Ako je chránený celý report?',
    answer:
      'Celý report sa odomyká cez časovo obmedzený e-mailový odkaz a vedomé potvrdenie. Prístup sa následne ukladá do podpísanej HttpOnly cookie s obmedzenou platnosťou.',
  },
] as const;

