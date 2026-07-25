import { notFound, redirect } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { findAuditById, peekReportAccessToken } from '@/lib/db/queries';
import { sha256 } from '@/lib/security/crypto';

export const dynamic = 'force-dynamic';

export default async function ConfirmAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await peekReportAccessToken(sha256(token));
  if (!access) return redirect('/audit/start?access=expired');
  const audit = await findAuditById(access.auditId);
  if (!audit || audit.expiresAt <= new Date() || audit.status !== 'ready') notFound();

  return <PublicShell><section className="mx-auto max-w-2xl px-5 py-20 lg:px-8 lg:py-28">
    <Card className="border-blue-300/20"><CardContent className="p-7 text-center md:p-10">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-blue-300/20 bg-blue-400/10 text-blue-200" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" className="size-7" stroke="currentColor" strokeWidth="1.8"><path d="m5 12 4 4L19 6"/><path d="M4 3h16v18H4z" opacity=".35"/></svg>
      </div>
      <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-blue-300 uppercase">Potvrdenie e-mailového odkazu</p>
      <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Otvoriť celý výsledok pre {audit.origin}</h1>
      <p className="mt-4 leading-7 text-slate-400">Toto vedomé potvrdenie zabraňuje tomu, aby automatický bezpečnostný scanner e-mailu označil adresu ako overenú bez vášho kliknutia.</p>
      <form method="post" action={`/access/${encodeURIComponent(token)}/confirm`} className="mt-8">
        <button type="submit" className="focus-ring inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90">Otvoriť môj celý výsledok</button>
      </form>
      <p className="mt-5 text-xs text-slate-600">Odkaz je jednorazový a časovo obmedzený. Pri ďalšom zariadení si môžete poslať nový odkaz.</p>
    </CardContent></Card>
  </section></PublicShell>;
}
