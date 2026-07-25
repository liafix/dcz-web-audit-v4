import Link from 'next/link';
import { AuditForm } from '@/components/forms/audit-form';
import { PublicShell } from '@/components/layout/public-shell';
import { LandingViewTracker } from '@/components/revenue/landing-view-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';

const deliverables = [
  ['Executive preview', 'Najväčšie riziko, príležitosť a odporúčaná prvá investícia pre rozhodovateľa.'],
  ['Money Leak Map', 'Technické evidence preložené do krokov, kde môže web brzdiť dôveru, dopyt alebo transakciu.'],
  ['ROI scenáre', 'Konzervatívny, realistický a rastový model založený iba na údajoch, ktoré zadáte.'],
  ['Kontextové riešenie', 'Primeraný scope od Conversion Foundation po Revenue Platform — s dôvodmi, nie automatickým upsellom.'],
] as const;

const steps = [
  ['01', 'Zadáte URL', 'Bez registrácie a bez dlhého formulára.'],
  ['02', 'Systém uloží evidence', 'Titulná stránka, technické súbory a voliteľné externé metriky.'],
  ['03', 'Uvidíte Money Leaks', 'Bariéry sú spojené s mechanizmom a blokovaným obchodným krokom.'],
  ['04', 'Doplníte business kontext', 'ROI vstupy a tri kvalifikačné otázky spresnia odporúčanie.'],
  ['05', 'Rozhodnete sa o ďalšom kroku', 'Opportunity Brief, relevantný dôkaz alebo diagnostický hovor s DCZ.'],
] as const;

const fit = [
  'B2B SaaS a komplexné služby s hodnotným leadom',
  'Developeri, reality a projekty s dlhším rozhodovaním',
  'Hotely, fitness, wellness a firmy s rezerváciami',
  'E-commerce a firmy s merateľnou transakčnou cestou',
] as const;

export default function HomePage() { return <PublicShell><LandingViewTracker />
  <section className="mx-auto max-w-7xl px-5 pt-14 pb-20 lg:px-8 lg:pt-24 lg:pb-28"><div className="mx-auto max-w-5xl text-center"><div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/8 px-3 py-1.5 text-xs font-semibold text-blue-200"><span className="size-1.5 rounded-full bg-emerald-300" />DCZ Revenue Diagnostic · evidence pred tvrdeniami</div><h1 className="text-gradient mt-7 text-5xl leading-[0.98] font-semibold tracking-tight sm:text-6xl lg:text-8xl">Zistite, kde váš web môže brzdiť peniaze.</h1><p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">Preveríme verejné signály titulnej stránky, ukážeme najväčšie obchodné bariéry a pomôžeme vám rozhodnúť, čo má zmysel opraviť ako prvé.</p></div>
  <Card className="mx-auto mt-10 max-w-4xl border-blue-400/20"><CardContent className="p-5 md:p-7"><AuditForm compact /><div className="mt-5 grid gap-2 text-xs text-slate-500 sm:grid-cols-3"><span className="trust-chip">Executive preview pred e-mailom</span><span className="trust-chip">Súkromný noindex report</span><span className="trust-chip">Žiadne falošné garancie tržieb</span></div></CardContent></Card>
  <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-600">Prevádzkovateľ: AesDC s. r. o. · IČO 55408575 · výsledok je predbežná diagnostika titulnej stránky.</p></section>

  <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="max-w-4xl"><p className="eyebrow">Čo získate</p><h2 className="section-title">Nie ďalší SEO checklist. Podklad na obchodné rozhodnutie.</h2><p className="mt-5 max-w-3xl leading-7 text-slate-400">High-end klient nepotrebuje iba vedieť, že chýba meta description. Potrebuje pochopiť, ktorý krok môže byť blokovaný, aký je dôkaz a aký scope opravy je primeraný.</p></div><div className="mt-8 grid gap-4 md:grid-cols-2">{deliverables.map(([title, text], index) => <Card key={title} className="group transition-transform duration-200 hover:-translate-y-1 hover:border-blue-300/20"><CardContent className="grid gap-4 sm:grid-cols-[auto_1fr]"><span className="grid size-11 place-items-center rounded-xl border border-blue-300/15 bg-blue-400/10 text-sm font-bold text-blue-200">0{index + 1}</span><div><h3 className="text-xl font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div></CardContent></Card>)}</div></section>

  <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="eyebrow text-amber-200">Money Leak Map</p><h2 className="section-title">Od signálu k blokovanému obchodnému kroku.</h2><p className="mt-5 leading-7 text-slate-400">Diagnostika rozlišuje akvizíciu, zrozumiteľnosť ponuky, dôveru, konverziu, transakciu a follow-up. Presné finančné sumy modeluje až z vašich vstupov.</p><Link href="/methodology" className={`${buttonClass('secondary')} mt-7`}>Pozrieť metodiku</Link></div><Card className="border-amber-300/15"><CardContent className="space-y-4"><div className="flex justify-between gap-3"><span className="text-xs font-semibold tracking-[.15em] text-amber-200 uppercase">Konverzný únik</span><span className="sample-badge">Vysoká priorita</span></div><h3 className="text-2xl font-semibold text-white">Návštevník nemusí rozpoznať jeden jasný ďalší krok</h3><p className="text-sm leading-7 text-slate-400">Zistený CTA signál sa preloží do mechanizmu: nejasnosť môže blokovať prechod od záujmu ku kvalifikovanému kontaktu.</p><div className="rounded-2xl border border-blue-300/10 bg-blue-400/[.045] p-4 text-sm text-blue-100"><strong>Odporúčaná oprava:</strong> zjednotiť hodnotovú ponuku, dominantný CTA a merateľný kvalifikačný flow.</div></CardContent></Card></div></section>

  <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="max-w-3xl"><p className="eyebrow">Ako to funguje</p><h2 className="section-title">Od URL po rozhodnutie a diagnostický hovor.</h2></div><div className="mt-8 grid gap-4 lg:grid-cols-5">{steps.map(([number, title, text]) => <Card key={number}><CardContent><span className="text-xs font-bold text-blue-300">{number}</span><h3 className="mt-4 text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></CardContent></Card>)}</div></section>

  <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="grid gap-8 lg:grid-cols-2"><div><p className="eyebrow text-violet-200">Pre koho má najväčší zmysel</p><h2 className="section-title">Firmy, kde jeden kvalitný dopyt alebo zákazník má reálnu hodnotu.</h2></div><Card><CardContent><ul className="space-y-4">{fit.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-300" />{item}</li>)}</ul><p className="mt-5 text-xs leading-5 text-slate-500">Diagnostika nie je určená na vytváranie falošných „strát“ alebo nátlak. Pri nízkom pokrytí radšej zobrazí neistotu.</p></CardContent></Card></div></section>

  <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="rounded-3xl border border-blue-300/15 bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10 p-8 text-center md:p-14"><p className="eyebrow">Revenue Diagnostic → riešenie</p><h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold text-white md:text-5xl">Najskôr ukážeme dôkaz. Potom odporučíme primeraný ďalší krok.</h2><p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">Conversion Foundation, Growth Funnel alebo Revenue Platform — iba podľa zistení, ROI kontextu a investičnej pripravenosti.</p><a href="#audit-url" className={`${buttonClass('primary')} mt-8`}>Analyzovať obchodné bariéry</a></div></section>
</PublicShell>; }
