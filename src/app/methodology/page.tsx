import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/layout/public-shell';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { METHODOLOGY_FAQ } from '@/lib/seo/methodology';
import { buildPublicMetadata, METHODOLOGY_SEO } from '@/lib/seo/metadata';
import {
  type BreadcrumbItem,
  methodologyPageGraph,
} from '@/lib/seo/schema';

export const metadata: Metadata = buildPublicMetadata(METHODOLOGY_SEO);

const breadcrumbs: readonly BreadcrumbItem[] = [
  { name: 'Domov', href: '/' },
  { name: 'Metodika', href: '/methodology' },
];

const checkedSignals = [
  'HTTPS, výsledný HTTP stav, čas a veľkosť textovej odpovede',
  'základné bezpečnostné hlavičky, kompresia a mobilný viewport',
  'robots.txt, odkazovaná alebo štandardná sitemap.xml',
  'title, meta description, canonical, meta robots a čitateľné JSON-LD typy',
  'H1, hierarchia nadpisov, jazyk dokumentu a základné obrazové alt atribúty',
  'labely formulárov, dostupné názvy interaktívnych prvkov a kontaktné cesty',
  'privacy, predstavenie firmy, identita prevádzkovateľa, CTA, formulár a obchodné kroky',
  'voliteľné mobilné PageSpeed kategórie performance, accessibility, SEO a best practices',
] as const;

export default function MethodologyPage() {
  return (
    <PublicShell>
      <JsonLd data={methodologyPageGraph(breadcrumbs, METHODOLOGY_FAQ)} />
      <article className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-20">
        <Breadcrumbs items={breadcrumbs} />
        <p className="eyebrow mt-10">Metodika Revenue Diagnostic v4</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">
          Dôkazy pred tvrdeniami
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          DCZ WebAudit je predbežná automatická diagnostika verejne dostupných signálov titulnej
          stránky. Technické dôkazy oddeľuje od obchodnej interpretácie, neznámych oblastí a
          modelových scenárov.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Verzia metodiky: v4 · Posledná obsahová aktualizácia: 26. júl 2026
        </p>

        <div className="mt-12 space-y-5">
          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">1. Čo je DCZ WebAudit?</h2>
              <p className="mt-4 leading-7 text-slate-300">
                DCZ WebAudit je webová aplikácia a predbežná diagnostická služba prevádzkovaná
                spoločnosťou AesDC s. r. o. Vyhodnocuje verejne dostupnú titulnú stránku, jej
                základné technické súbory a voliteľné externé metriky bez prihlásenia do
                kontrolovaného webu.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                2. Na čo slúži predbežná diagnostika?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Slúži na rýchlu orientáciu v merateľných signáloch a na určenie prvých tém, ktoré
                má zmysel manuálne overiť. Výstup pomáha oddeliť pozorovaný dôkaz od možného dopadu
                na návštevnosť, dôveru, kontakt alebo transakciu.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                Diagnostika nesľubuje pozície, návštevnosť, leady ani tržby a sama osebe nepotvrdzuje
                príčinu obchodného výsledku.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                3. Aké verejné signály kontrolujeme?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Kontroly vychádzajú z HTML a HTTP odpovedí, ktoré dokáže bezpečne získať existujúci
                auditný engine:
              </p>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-400 md:grid-cols-2">
                {checkedSignals.map((signal) => (
                  <li key={signal} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-300" />
                    {signal}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                4. Čo audit nekontroluje?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Nevykonáva kompletný crawl webu, browser rendering, vizuálne screenshoty,
                prihlasovanie, odosielanie formulárov, platby ani zmeny na cieľovom webe.
                JavaScript-only obsah môže zostať mimo merania.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                Výsledok nie je penetračný, právny, účtovný ani úplný manuálny SEO alebo UX audit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                5. Ako vzniká výsledok?
              </h2>
              <ol className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  'URL sa normalizuje a overí voči povoleným protokolom, portom, DNS a verejným IP adresám.',
                  'Titulná stránka sa načíta bezpečným GET requestom s kontrolou každého redirectu.',
                  'Samostatne sa skontrolujú robots.txt, sitemap.xml a voliteľné PageSpeed kategórie.',
                  'Z uloženého HTML sa deterministicky extrahujú technické, SEO, accessibility, trust a conversion signály.',
                  'Pravidlá vytvoria findings, strengths, skóre, pokrytie a confidence iba z aplikovateľných meraní.',
                  'Report oddelí dôkaz, možný mechanizmus bariéry, odporúčanie a limity.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-4 rounded-2xl border border-white/8 p-4 text-sm leading-6 text-slate-400">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-400/10 font-semibold text-blue-200">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                6. Čo znamenajú obchodné bariéry?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Obchodná bariéra je verejne pozorovaný signál alebo kombinácia signálov, ktoré môžu
                sťažovať získanie návštevy, pochopenie ponuky, vytvorenie dôvery, kontakt,
                rezerváciu alebo transakciu.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                Money Leak Map opisuje možný mechanizmus trenia. Neoznačuje automaticky dokázanú
                finančnú stratu a nepriraďuje sumu bez vstupov používateľa.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                7. Ako interpretovať výsledok?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Evidence, severity, confidence, pokrytie a obmedzenia treba čítať spoločne.
                „Nezistené“ môže znamenať, že signál v načítanom HTML nebol dostupný; nemusí to
                dokazovať, že na celom webe neexistuje.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                Najvyššiu prioritu majú findingy s jasným zdrojom, vysokou istotou a dopadom, ktorý
                je možné manuálne potvrdiť.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                8. Aké sú limity automatizovaného auditu?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Rozsah je obmedzený na titulnú stránku, dostupné technické súbory, heuristické
                rozpoznanie textových signálov a časové či veľkostné limity. Externé PageSpeed dáta
                nemusia byť dostupné a dynamické prvky môžu vyžadovať browser test.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                False positive aj nezistený problém sú možné; preto automatický výstup nie je
                posledným krokom pri dôležitom investičnom rozhodnutí.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                9. Ako chránime auditovaný web?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Audit povoľuje iba HTTP a HTTPS na štandardných portoch, odmieta súkromné alebo
                interné IP rozsahy, kontroluje všetky DNS odpovede, pripína request na overenú IP a
                znovu validuje každý redirect. Odpovede majú časový, typový a veľkostný limit.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                Systém sa neprihlasuje, neodosiela formuláre a nevykonáva platby. Verejný formulár
                na spustenie auditu má samostatné origin, Turnstile a rate-limit kontroly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                10. Ako chránime údaje používateľa?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Celý report sa odomyká cez časovo obmedzený e-mailový odkaz a vedomé potvrdenie.
                Prístup sa ukladá do podpísanej HttpOnly cookie. E-mailové access, brief a
                unsubscribe tokeny sa overujú kryptograficky a majú obmedzenú platnosť.
              </p>
              <p className="mt-3 leading-7 text-slate-400">
                Rozsah údajov, účely a doby uchovávania opisuje samostatná stránka{' '}
                <Link className="font-semibold text-blue-300 hover:text-blue-200" href="/privacy">
                  Ochrana súkromia
                </Link>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                11. Predbežná diagnostika vs. manuálny audit
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Automatická diagnostika rýchlo triedi verejné signály podľa jednotných pravidiel.
                Manuálny audit pridáva širší crawl, browser a device testy, obchodný kontext,
                rozhovory, expertné posúdenie a overenie, ktoré automatizácia nevie nahradiť.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                12. Čo urobiť po získaní výsledku?
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Najprv manuálne potvrďte prioritné findingy, potom ich zoraďte podľa pravdepodobného
                dopadu, istoty a náročnosti opravy. Jednoduché technické nedostatky možno riešiť
                priamo; komplexné SEO, UX, právne a bezpečnostné témy patria príslušnému odborníkovi.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className={buttonClass('primary')} href="/#audit-url">
                  Spustiť predbežnú diagnostiku
                </Link>
                <Link className={buttonClass('secondary')} href="/contact">
                  Prejsť výsledok s DCZ
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold text-white">
                13. Verzia a aktualizácia metodiky
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Táto verejná metodika opisuje auditný engine DCZ WebAudit Revenue Diagnostic v4.
                Dátum poslednej obsahovej revízie je 26. júl 2026. Pri zmene meraných pravidiel,
                rozsahu alebo bezpečnostného načítania sa musí aktualizovať aj tento dokument.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-16" aria-labelledby="methodology-faq-title">
          <p className="eyebrow">Časté otázky</p>
          <h2 id="methodology-faq-title" className="section-title">
            Stručné odpovede k rozsahu a limitom
          </h2>
          <div className="mt-7 grid gap-4">
            {METHODOLOGY_FAQ.map((item) => (
              <Card key={item.question}>
                <CardContent>
                  <h3 className="text-xl font-semibold text-white">{item.question}</h3>
                  <p className="mt-3 leading-7 text-slate-400">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
