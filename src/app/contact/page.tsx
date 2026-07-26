import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/layout/public-shell';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { buildPublicMetadata, CONTACT_SEO } from '@/lib/seo/metadata';
import { type BreadcrumbItem, contactPageGraph } from '@/lib/seo/schema';

export const metadata: Metadata = buildPublicMetadata(CONTACT_SEO);

const breadcrumbs: readonly BreadcrumbItem[] = [
  { name: 'Domov', href: '/' },
  { name: 'Kontakt', href: '/contact' },
];

export default function ContactPage() {
  return (
    <PublicShell>
      <JsonLd data={contactPageGraph(breadcrumbs)} />
      <section className="mx-auto max-w-4xl px-5 py-12 lg:px-8 lg:py-20">
        <Breadcrumbs items={breadcrumbs} />
        <p className="mt-10 text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">
          DCZ WebAudit · služba prevádzkovaná AesDC s. r. o.
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">Premeňme výsledok na konkrétny plán</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Pošlite nám URL, cieľ a najväčší problém. Prejdeme dostupné zistenia a navrhneme
          primeraný ďalší krok. Automatická diagnostika ani konzultácia negarantujú konkrétny
          obchodný alebo vyhľadávací výsledok.
        </p>
        <Card className="mt-10"><CardContent>
          <p className="text-sm text-slate-400">E-mail</p><a className="mt-1 block text-xl font-semibold text-white" href="mailto:info@dcz.sk">info@dcz.sk</a>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            AesDC s. r. o. je právny prevádzkovateľ DCZ WebAudit. DCZ.sk je súvisiaca agentúrna a
            kontaktná stránka prevádzkovateľa; nejde o názov automatizovanej aplikácie DCZ WebAudit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3"><a className={buttonClass('primary')} href="https://dcz.sk/kontakt?utm_source=dczwebaudit&utm_medium=contact&utm_campaign=next_mvp">Otvoriť kontaktný formulár DCZ</a><a className={buttonClass('secondary')} href="https://dcz.sk">Pozrieť dcz.sk</a></div>
        </CardContent></Card>
        <p className="mt-8 text-sm leading-7 text-slate-400">
          Pred kontaktom si môžete prečítať,{' '}
          <Link className="font-semibold text-blue-300 hover:text-blue-200" href="/methodology">
            ako diagnostika funguje a kde má limity
          </Link>, alebo sa vrátiť na{' '}
          <Link className="font-semibold text-blue-300 hover:text-blue-200" href="/#audit-url">
            formulár predbežného auditu
          </Link>.
        </p>
      </section>
    </PublicShell>
  );
}
