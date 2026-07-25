'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-[70vh] place-items-center px-5"><div className="max-w-xl text-center"><p className="text-sm font-semibold tracking-[0.2em] text-red-300 uppercase">Chyba aplikácie</p><h1 className="mt-4 text-4xl font-semibold text-white">Niečo sa nepodarilo dokončiť</h1><p className="mt-4 text-slate-400">Skúste požiadavku zopakovať. Ak problém trvá, kontaktujte DCZ.</p><Button className="mt-7" onClick={reset}>Skúsiť znova</Button></div></main>;
}
