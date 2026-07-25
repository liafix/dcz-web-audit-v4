import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { buttonClass } from '@/components/ui/button';

export function BookingCta({ token, status }: { token: string; status?: string | null }) {
  return <section id="booking" className="scroll-mt-24"><Card className="border-violet-300/20"><CardContent className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><p className="eyebrow text-violet-200">Diagnostický hovor</p><h2 className="mt-3 text-3xl font-semibold text-white">Prejdime tri najväčšie bariéry v obchodnom kontexte.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Na 20-minútovom hovore overíme, ktoré zistenia majú reálnu prioritu, čo môže byť false positive a či dáva zmysel riešenie od DCZ.</p>{status === 'booked' && <p className="mt-3 text-sm text-emerald-200">Termín je označený ako rezervovaný.</p>}</div><Link href={`/book/${encodeURIComponent(token)}`} className={buttonClass('primary')}>{status === 'booked' ? 'Otvoriť rezerváciu' : 'Rezervovať 20-min diagnostiku'}</Link></CardContent></Card></section>;
}
