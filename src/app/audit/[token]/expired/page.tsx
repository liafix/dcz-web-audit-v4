import Link from 'next/link';
import { PublicShell } from '@/components/layout/public-shell';
import { buttonClass } from '@/components/ui/button';

export default function ExpiredAuditPage() {
  return <PublicShell><section className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-sm font-semibold tracking-[0.2em] text-amber-300 uppercase">Platnosť vypršala</p><h1 className="mt-4 text-4xl font-semibold text-white">Tento výsledok už nie je dostupný</h1><p className="mt-5 leading-7 text-slate-400">Z dôvodu minimalizácie údajov majú audity obmedzenú životnosť. Spustite nový audit aktuálnej verzie webu.</p><Link className={`${buttonClass('primary')} mt-8`} href="/audit/start">Spustiť nový audit</Link></section></PublicShell>;
}
