import type { Metadata } from 'next';
import { PublicShell } from '@/components/layout/public-shell';

export const metadata: Metadata = {
  title: 'Ochrana súkromia',
  description: 'Informácie o spracúvaní osobných a obchodných údajov v službe DCZ WebAudit.',
};

const sections = [
  [
    'Prevádzkovateľ',
    <>
      Prevádzkovateľom služby je <strong>AesDC s. r. o.</strong>, IČO 55408575,
      Štvrť SNP 132/23, 914 51 Trenčianske Teplice. Kontakt pre otázky a uplatnenie práv:{' '}
      <a className="text-blue-300 hover:text-blue-200" href="mailto:info@dcz.sk">info@dcz.sk</a>.
    </>,
  ],
  [
    'Aké údaje spracúvame',
    <>
      Pri diagnostike spracúvame zadanú URL, verejne dostupné technické a obsahové signály titulnej
      stránky, výsledky pravidiel, stav spracovania, základnú atribúciu návštevy a bezpečnostné
      identifikátory v hashovanej podobe. Pri doručení výsledku spracúvame e-mail; meno a firma sú
      voliteľné. Ak používateľ pokračuje, môže dobrovoľne doplniť ekonomické vstupy pre ROI scenár,
      kvalifikačné odpovede, požiadavku na manuálnu kontrolu alebo rezerváciu hovoru. Neukladáme
      heslá a neodosielame formuláre na analyzovanom webe.
    </>,
  ],
  [
    'Účely a právne základy',
    <>
      Údaje používame na vykonanie používateľom vyžiadanej diagnostiky, bezpečné doručenie reportu,
      vytvorenie Opportunity Briefu, spracovanie kvalifikácie, rezervácie alebo manuálnej kontroly,
      ochranu služby pred zneužitím a plnenie zákonných povinností. Primerané servisné pripomenutia
      môžu nadviazať na používateľom vyžiadaný audit alebo brief. Všeobecné marketingové správy
      posielame iba pri samostatnom dobrovoľnom súhlase, ktorý možno kedykoľvek odvolať.
    </>,
  ],
  [
    'ROI, profilovanie a lead scoring',
    <>
      ROI výstup je modelový scenár založený na údajoch zadaných používateľom. Nie je garanciou ani
      presným výpočtom ušlých tržieb. Služba môže deterministicky vytvoriť orientačný obchodný profil,
      odporúčanie riešenia a Fit/Intent skóre, aby DCZ vedelo prioritizovať reakciu. Skóre nemá voči
      používateľovi právne alebo obdobne významný účinok a možno ho manuálne preskúmať.
    </>,
  ],
  [
    'Doba uchovávania',
    <>
      Auditné dôkazy a reporty štandardne uchovávame najviac 45 dní. Bezpečnostné udalosti najviac
      90 dní a funnel udalosti najviac 180 dní. Opportunity Brief alebo prístupový token môže mať
      vlastnú kratšiu expiráciu. Kontakt a dobrovoľne poskytnutý obchodný kontext možno uchovávať
      najviac 24 mesiacov od poslednej relevantnej komunikácie, pokiaľ skoršie vymazanie nevyžaduje
      zákon, zánik účelu alebo oprávnená žiadosť.
    </>,
  ],
  [
    'Príjemcovia a spracovatelia',
    <>
      Podľa produkčnej konfigurácie môžu byť zapojení poskytovatelia Node.js hostingu, PostgreSQL
      databázy, transakčného e-mailu, ochrany formulárov, technického monitoringu, PageSpeed merania
      a rezervácie termínu. Predpokladané služby zahŕňajú Hostinger alebo Vercel, Neon, Resend,
      Cloudflare, Google a zvoleného rezervačného poskytovateľa. Pri prenose mimo Európskeho
      hospodárskeho priestoru sa používajú záruky podľa podmienok konkrétneho poskytovateľa.
    </>,
  ],
  [
    'Cookies a bezpečný prístup',
    <>
      Používame nevyhnutné cookies na bezpečný prístup k reportu a admin reláciu. Individuálne
      reporty, briefy, booking a admin stránky sú nastavené ako noindex. E-mailové prístupové tokeny
      sa v databáze ukladajú iba ako kryptografický hash a majú obmedzenú platnosť.
    </>,
  ],
  [
    'Vaše práva',
    <>
      Môžete požiadať o prístup, opravu, vymazanie, obmedzenie alebo prenos údajov a namietať
      spracúvanie. Súhlas môžete odvolať bez vplyvu na spracúvanie pred jeho odvolaním. Žiadosti
      posielajte na info@dcz.sk; na ochranu údajov môžeme primerane overiť vašu totožnosť. Máte
      tiež právo obrátiť sa na Úrad na ochranu osobných údajov Slovenskej republiky.
    </>,
  ],
] as const;

export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl px-5 py-16 leading-7 text-slate-300 lg:px-8 lg:py-24">
        <p className="eyebrow">Ochrana súkromia</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">Ako pracujeme s údajmi</h1>
        <p className="mt-5 text-sm text-slate-500">Dátum účinnosti: 25. júl 2026</p>
        <p className="mt-6">
          Tieto informácie opisujú spracúvanie údajov v službe DCZ WebAudit Revenue Diagnostic.
          Služba analyzuje verejne dostupné signály a nevykonáva zásahy do kontrolovaného webu.
          Pred ostrým launchom odporúčame finálny text podrobiť kvalifikovanej právnej kontrole.
        </p>
        {sections.map(([title, content]) => (
          <section key={title}>
            <h2 className="mt-10 text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-3">{content}</p>
          </section>
        ))}
      </article>
    </PublicShell>
  );
}
