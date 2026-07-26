import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin/admin-login-form';
import { Card, CardContent } from '@/components/ui/card';
import { BrandMark } from '@/components/ui/brand-mark';
import { adminSession } from '@/lib/auth/admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await adminSession()) redirect('/admin');
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-7">
          <BrandMark variant="admin" />
          <h1 className="mt-8 text-2xl font-semibold text-white">Interná administrácia</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Prístup je určený iba pre správcu DCZ WebAudit.</p>
          <div className="mt-7"><AdminLoginForm /></div>
        </CardContent>
      </Card>
    </main>
  );
}
