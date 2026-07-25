import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-mark';
import { buttonClass } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth/admin-session';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-[#080b14]">
      <header className="border-b border-white/8 bg-[#0d1220]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Link href="/admin"><BrandMark /></Link>
          <nav className="flex items-center gap-2">
            <Link className={buttonClass('ghost')} href="/admin">Dashboard</Link>
            <form action="/api/admin/logout" method="post"><button className={buttonClass('secondary')} type="submit">Odhlásiť</button></form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
    </div>
  );
}
