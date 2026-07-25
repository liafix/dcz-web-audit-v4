import { notFound, redirect } from 'next/navigation';
import { ManualReviewForm } from '@/components/forms/manual-review-form';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { findAuditByToken } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function ManualReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  if (audit.status !== 'ready') redirect(`/audit/${token}/progress`);

  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold tracking-[0.2em] text-violet-300 uppercase">High-intent ďalší krok</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Požiadajte DCZ o manuálnu kontrolu</h1>
        <p className="mt-4 leading-7 text-slate-400">Automatický výsledok doplníme o obchodný kontext, priority a realistický návrh riešenia pre {audit.origin}.</p>
        <Card className="mt-8"><CardContent><ManualReviewForm token={token} /></CardContent></Card>
      </section>
    </PublicShell>
  );
}
