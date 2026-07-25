import Link from 'next/link';
import { PublicShell } from '@/components/layout/public-shell';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return <PublicShell><section className="mx-auto max-w-3xl px-5 py-24 text-center"><p className="text-sm font-semibold tracking-[0.2em] text-blue-300 uppercase">404</p><h1 className="mt-4 text-5xl font-semibold text-white">Táto stránka neexistuje</h1><p className="mt-5 text-slate-400">Vráťte sa na úvod alebo spustite nový audit.</p><Link className={`${buttonClass('primary')} mt-8`} href="/">Späť na úvod</Link></section></PublicShell>;
}
