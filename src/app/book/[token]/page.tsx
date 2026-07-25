import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';
import { requireRevenueAudit } from '@/lib/revenue/access';
import { RevenueEventTracker } from '@/components/revenue/revenue-event-tracker';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function BookingConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { audit } = await requireRevenueAudit(token);
    return (
      <PublicShell>
        <RevenueEventTracker token={token} event="booking_confirmation_viewed" />
        <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="text-center">
            <span className="sample-badge observed">Diagnostický hovor</span>
            <h1 className="mt-5 text-4xl font-semibold text-white md:text-6xl">Rezervovať 20-minútovú diagnostiku?</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Na hovore prejdeme tri najväčšie bariéry webu {audit.origin}, overíme obchodný kontext a povieme, či má zmysel riešenie od DCZ.
            </p>
          </div>
          <Card className="mt-10 border-violet-300/20">
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li>• audit a Money Leak Map sa prenesú ako kontext,</li>
                <li>• rezervačnému systému neposielame ROI hodnoty ani interné lead score,</li>
                <li>• termín vyberiete až na zabezpečenej stránke poskytovateľa rezervácií.</li>
              </ul>
              <form action={`/book/${encodeURIComponent(token)}/confirm`} method="post" className="mt-7">
                <button className={`${buttonClass('primary')} w-full`} type="submit">Pokračovať na výber termínu</button>
              </form>
              <a className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-slate-200" href={`/audit/${encodeURIComponent(token)}/full`}>Vrátiť sa k reportu</a>
            </CardContent>
          </Card>
        </main>
      </PublicShell>
    );
  } catch {
    notFound();
  }
}
