import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ResendAccessForm } from '@/components/forms/resend-access-form';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { findAuditByToken } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function CheckEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  if (audit.status !== 'ready') redirect(`/audit/${token}/progress`);

  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="size-8" stroke="currentColor" strokeWidth="1.8"><path d="M3 6.75 12 13l9-6.25"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase">Bezpečný prístup</p>
          <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Skontrolujte svoj e-mail</h1>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-400">Poslali sme časovo obmedzený odkaz k celému výsledku pre <strong className="text-slate-200">{audit.origin}</strong>. Odkaz platí 72 hodín.</p>
        </div>
        <Card className="mt-8"><CardContent>
          <ol className="grid gap-3 text-sm leading-6 text-slate-300 sm:grid-cols-3">
            <li className="rounded-xl border border-white/8 bg-white/[0.025] p-4"><strong className="block text-white">1. Otvorte e-mail</strong>Skontrolujte aj Spam alebo Reklamy.</li>
            <li className="rounded-xl border border-white/8 bg-white/[0.025] p-4"><strong className="block text-white">2. Otvorte odkaz</strong>Na potvrdzovacej stránke vedome kliknete na otvorenie reportu.</li>
            <li className="rounded-xl border border-white/8 bg-white/[0.025] p-4"><strong className="block text-white">3. Vráťte sa k výsledku</strong>Prístup zostane bezpečne uložený v prehliadači.</li>
          </ol>
          <div className="mt-7 border-t border-white/8 pt-6"><ResendAccessForm token={token} /></div>
          <p className="mt-5 text-center text-sm text-slate-500">Zadali ste nesprávny e-mail? <Link className="text-blue-300 hover:text-blue-200" href={`/audit/${token}/unlock`}>Opraviť adresu</Link></p>
        </CardContent></Card>
      </section>
    </PublicShell>
  );
}
