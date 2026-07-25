import { notFound } from 'next/navigation';
import { FailedRetryActions } from '@/components/audit/failed-retry-actions';
import { PublicShell } from '@/components/layout/public-shell';
import { findAuditByToken } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';
const MAX_ATTEMPTS = 3;

export default async function FailedAuditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  return <PublicShell><section className="mx-auto max-w-3xl px-5 py-24 text-center">
    <p className="text-sm font-semibold tracking-[0.2em] text-red-300 uppercase">Audit nebol dokončený</p>
    <h1 className="mt-4 text-4xl font-semibold text-white">Web sa nepodarilo bezpečne analyzovať</h1>
    <p className="mt-5 leading-7 text-slate-400">{audit.failureMessage ?? 'Cieľ mohol byť nedostupný, príliš veľký alebo smeroval na nepovolenú sieťovú adresu.'}</p>
    {audit.failureErrorId && <p className="mt-3 text-xs text-slate-600">ID chyby pre podporu: {audit.failureErrorId}</p>}
    <FailedRetryActions token={token} retryable={audit.attemptCount < MAX_ATTEMPTS} />
  </section></PublicShell>;
}
