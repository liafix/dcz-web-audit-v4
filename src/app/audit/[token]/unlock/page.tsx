import { notFound, redirect } from 'next/navigation';
import { UnlockForm } from '@/components/forms/unlock-form';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { hasVerifiedFunnelSession } from '@/lib/auth/funnel-verification';
import { findAuditByToken } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function UnlockPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await findAuditByToken(token);
  if (!audit) notFound();
  if (audit.status !== 'ready') redirect(`/audit/${token}/progress`);
  const funnelVerified = await hasVerifiedFunnelSession(audit.id);

  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">Bezpečný prístup</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Odomknite celý výsledok</h1>
        <p className="mt-4 text-slate-400">Audit pre {audit.origin} je pripravený. E-mail slúži na bezpečný návrat k výsledku.</p>
        <Card className="mt-8"><CardContent><UnlockForm token={token} funnelVerified={funnelVerified} /></CardContent></Card>
      </section>
    </PublicShell>
  );
}
