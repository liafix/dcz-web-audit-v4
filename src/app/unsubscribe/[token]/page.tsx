import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyUnsubscribeToken } from '@/lib/follow-up/unsubscribe';

export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!verifyUnsubscribeToken(token)) notFound();
  return <PublicShell><section className="mx-auto max-w-xl px-5 py-20"><Card><CardContent><p className="eyebrow">Nastavenie komunikácie</p><h1 className="mt-3 text-3xl font-semibold text-white">Odhlásiť marketingové follow-upy?</h1><p className="mt-4 leading-7 text-slate-400">Transakčné správy súvisiace s auditom alebo rezervovaným termínom týmto nie sú dotknuté.</p><form method="post" action={`/unsubscribe/${encodeURIComponent(token)}/confirm`} className="mt-7"><Button type="submit" className="w-full">Potvrdiť odhlásenie</Button></form></CardContent></Card></section></PublicShell>;
}
