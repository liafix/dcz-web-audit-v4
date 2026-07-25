import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-mark';
import { buttonClass } from '@/components/ui/button';

const links = [['Metodika', '/methodology'], ['Súkromie', '/privacy'], ['Kontakt', '/contact']] as const;
export function Header() {
  return <header className="sticky top-0 z-40 border-b border-white/8 bg-[#080b14]/86 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 lg:px-8">
    <Link className="focus-ring rounded-xl" href="/"><BrandMark /></Link>
    <nav className="hidden items-center gap-1 md:flex" aria-label="Hlavná navigácia">{links.map(([label, href]) => <Link key={href} className="focus-ring rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors duration-200 hover:text-white" href={href}>{label}</Link>)}</nav>
    <div className="flex items-center gap-2"><Link className={`${buttonClass('secondary')} hidden sm:inline-flex`} href="/audit/start">Spustiť audit</Link><details className="relative md:hidden"><summary className="focus-ring grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-white" aria-label="Otvoriť menu"><svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg></summary><nav className="absolute right-0 mt-3 grid min-w-48 rounded-2xl border border-white/12 bg-[#0d1220] p-2 shadow-2xl shadow-black/40" aria-label="Mobilná navigácia">{links.map(([label, href]) => <Link key={href} className="focus-ring rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white" href={href}>{label}</Link>)}<Link className={`${buttonClass('primary')} mt-2 sm:hidden`} href="/audit/start">Spustiť audit</Link></nav></details></div>
  </div></header>;
}
