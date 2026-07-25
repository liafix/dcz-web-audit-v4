import { notFound, redirect } from 'next/navigation';
import { ProgressClient } from '@/components/audit/progress-client';
import { PublicShell } from '@/components/layout/public-shell';
import { findAuditByToken } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function AuditProgressPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  if (audit.expiresAt <= new Date() || audit.status === 'expired') redirect(`/audit/${token}/expired`);
  if (audit.status === 'ready') redirect(`/audit/${token}/result`);

  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-5 py-14 lg:px-8 lg:py-20">
        <p className="text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">Predbežný audit</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Spracúvame verejné signály webu</h1>
        <p className="mt-4 break-all text-sm text-slate-500">{audit.targetUrl}</p>
        <div className="mt-8"><ProgressClient token={token} initialStatus={audit.status} /></div>
      </section>
    </PublicShell>
  );
}
