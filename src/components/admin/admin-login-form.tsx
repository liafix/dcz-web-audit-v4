'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { useTurnstileAttempt } from '@/components/forms/use-turnstile-attempt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLoginForm() {
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstileAttempt();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const attempt = turnstile.begin(Boolean(siteKey));
    if (attempt.status === 'busy') return;
    if (attempt.status === 'missing') return setError('Dokončite viditeľné bezpečnostné overenie a odošlite formulár znova.');
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password'), turnstileToken: attempt.token }) });
      const data = (await response.json()) as { error?: string; errorId?: string };
      if (!response.ok) throw new Error(`${data.error ?? 'Prihlásenie zlyhalo.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      router.replace('/admin'); router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Prihlásenie zlyhalo.');
      turnstile.release(true);
    }
  }

  const challengeIssue = (text: string) => {
    turnstile.clearChallenge();
    setError(text);
  };

  return <form onSubmit={submit} className="space-y-4"><label className="space-y-2 text-sm text-slate-300"><span>E-mail</span><Input required type="email" name="email" autoComplete="username" /></label><label className="space-y-2 text-sm text-slate-300"><span>Heslo</span><Input required minLength={16} type="password" name="password" autoComplete="current-password" /></label><TurnstileWidget ref={turnstile.widgetRef} siteKey={siteKey} onToken={turnstile.onToken} onExpired={() => challengeIssue('Platnosť bezpečnostného overenia vypršala. Dokončite ho znova.')} onError={() => challengeIssue('Bezpečnostné overenie sa nepodarilo načítať. Skúste ho znova.')} onTimeout={() => challengeIssue('Bezpečnostné overenie vypršalo pre nečinnosť. Dokončite ho znova.')} /><Button type="submit" disabled={turnstile.pending} className="w-full">{turnstile.pending ? 'Overujeme…' : 'Prihlásiť sa'}</Button>{error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}</form>;
}
