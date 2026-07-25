import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { findOpportunityBriefByHash } from '@/lib/db/revenue-queries';
import { sha256 } from '@/lib/security/crypto';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function BriefBookingConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await findOpportunityBriefByHash(sha256(token));
  if (!record) notFound();
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <span className="sample-badge observed">Opportunity Brief</span>
          <h1 className="mt-5 text-4xl font-semibold text-white md:text-6xl">Prejsť odporúčanie s DCZ</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Termín môže rezervovať aj člen rozhodovacieho tímu, ktorému bol brief bezpečne zdieľaný. Do rezervačného systému sa prenesie iba anonymná referencia diagnostiky.
          </p>
        </div>
        <Card className="mt-10 border-blue-300/20"><CardContent>
          <form action={`/brief/${encodeURIComponent(token)}/book/confirm`} method="post">
            <button className={`${buttonClass('primary')} w-full`} type="submit">Pokračovať na výber termínu</button>
          </form>
          <a className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-slate-200" href={`/brief/${encodeURIComponent(token)}`}>Vrátiť sa k briefu</a>
        </CardContent></Card>
      </main>
    </PublicShell>
  );
}
