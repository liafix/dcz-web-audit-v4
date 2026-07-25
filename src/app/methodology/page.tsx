import type { Metadata } from 'next';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Metodika Revenue Diagnostic',
  description: 'Ako DCZ WebAudit získava dôkazy, vytvára Money Leak Map, počíta skóre, pokrytie a modelové ROI scenáre.',
};

const steps = [
  ['1', 'Bezpečná URL', 'Povoľujeme iba HTTP/HTTPS, štandardné porty a verejné IP adresy. Zmiešané verejné a privátne DNS výsledky odmietame a každý redirect kontrolujeme znova.'],
  ['2', 'Verejný zdroj titulnej stránky', 'Načítame titulnú stránku s časovým a veľkostným limitom. Neodosielame formuláre, neprihlasujeme sa a nevykonávame platby.'],
  ['3', 'Deterministické signály', 'Kontrolujeme technické, SEO, accessibility, dôveryhodnostné, konverzné a príjmové signály, robots.txt, sitemap a dostupné PageSpeed dáta.'],
  ['4', 'Obchodný profil', 'Z uložených signálov odhadneme vertikálu a obchodný model. Pri nízkej istote výsledok označíme ako odhad a používateľ ho môže spresniť v kvalifikácii.'],
  ['5', 'Skóre, pokrytie a confidence', 'Skóre počítame iba z aplikovateľných nameraných pravidiel. Neznáme údaje znižujú pokrytie a confidence, nie automaticky skóre.'],
  ['6', 'Executive Summary a Money Leak Map', 'Prioritné evidence prekladáme do mechanizmu, ktorý môže brzdiť návštevnosť, dôveru, kontakt, rezerváciu alebo transakciu. Neuvádzame finančnú sumu bez obchodných vstupov.'],
  ['7', 'Modelové ROI scenáre', 'Konzervatívny, realistický a rastový scenár vzniká iba z údajov, ktoré zadá používateľ. Ide o rozhodovací model, nie garanciu ani presný výpočet ušlých tržieb.'],
  ['8', 'Vysvetliteľná ponuka', 'Odporúčanie DCZ, lead scoring a relevantný dôkaz používajú uložené findingy, kvalifikáciu a správanie. Demo alebo koncept sú vždy transparentne označené.'],
] as const;

export default function MethodologyPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-5xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="eyebrow">Metodika Revenue Diagnostic v4</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">Dôkazy pred tvrdeniami</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          DCZ WebAudit je predbežná automatická diagnostika verejne dostupných signálov titulnej stránky.
          Technické evidence oddeľuje od obchodnej interpretácie, neznámych oblastí a modelových scenárov.
        </p>
        <div className="mt-10 grid gap-4">
          {steps.map(([number, title, text]) => (
            <Card key={number}>
              <CardContent className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                <span className="grid size-11 place-items-center rounded-xl bg-blue-400/10 font-bold text-blue-200">{number}</span>
                <div>
                  <h2 className="text-xl font-semibold text-white">{title}</h2>
                  <p className="mt-2 leading-7 text-slate-400">{text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-10 border-amber-300/15">
          <CardContent>
            <h2 className="text-xl font-semibold text-white">Čo automatická diagnostika nerobí</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Nevykonáva browser rendering, vizuálne screenshoty, prihlásenie, odosielanie formulárov,
              platby ani kompletný crawl celého webu. JavaScript-only obsah môže zostať neviditeľný.
              Money Leak Map opisuje možný mechanizmus bariéry a ROI je modelový scenár zo zadaných údajov.
              Dôležité investičné rozhodnutia odporúčame doplniť manuálnou kontrolou.
            </p>
          </CardContent>
        </Card>
      </article>
    </PublicShell>
  );
}
