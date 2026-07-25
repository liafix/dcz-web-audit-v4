import type { Metadata } from 'next';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Kontakt' };

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">DCZ WebAgentúra</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">Premeňme výsledok na konkrétny plán</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Pošlite nám URL, cieľ a najväčší problém. Navrhneme, či má najväčší zmysel web, SEO, UX, rezervácia, platba alebo automatizácia.</p>
        <Card className="mt-10"><CardContent>
          <p className="text-sm text-slate-400">E-mail</p><a className="mt-1 block text-xl font-semibold text-white" href="mailto:info@dcz.sk">info@dcz.sk</a>
          <div className="mt-6 flex flex-wrap gap-3"><a className={buttonClass('primary')} href="https://dcz.sk/kontakt?utm_source=dczwebaudit&utm_medium=contact&utm_campaign=next_mvp">Otvoriť kontaktný formulár DCZ</a><a className={buttonClass('secondary')} href="https://dcz.sk">Pozrieť dcz.sk</a></div>
        </CardContent></Card>
      </section>
    </PublicShell>
  );
}
