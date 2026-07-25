import type { Metadata } from 'next';
import { AuditForm } from '@/components/forms/audit-form';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Spustiť predbežný audit',
  description: 'Zadajte verejnú URL a získajte predbežnú diagnostiku základných signálov webu.',
};

export default async function StartAuditPage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const query = await searchParams;
  const accessMessage = query.access === 'expired'
    ? 'E-mailový odkaz vypršal alebo už bol použitý. Spustite nový audit alebo si z výsledku pošlite nový odkaz.'
    : query.access === 'invalid'
      ? 'Odkaz sa nepodarilo bezpečne potvrdiť. Otvorte ho znova priamo z e-mailu alebo si pošlite nový.'
      : null;
  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">Bezpečný prvý krok</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-6xl">Spustite predbežný webový audit</h1>
        <p className="mt-5 max-w-2xl leading-7 text-slate-400">Zadávajte iba verejnú firemnú webstránku, ktorú máte oprávnenie analyzovať. Systém neodosiela formuláre a neprihlasuje sa.</p>
        {accessMessage && <p role="alert" className="mt-7 rounded-xl border border-amber-300/20 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-100">{accessMessage}</p>}
        <Card className="mt-8 border-blue-400/20">
          <CardContent className="p-6 md:p-8"><AuditForm /></CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
