import type { PropsWithChildren } from 'react';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

export function PublicShell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem]" />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
