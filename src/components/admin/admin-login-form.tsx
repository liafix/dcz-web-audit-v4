'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { TurnstileStatus } from '@/components/forms/turnstile-status';
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
    if (attempt.status !== 'started') {
      return setError(
        attempt.status === 'interaction_required'
          ? 'Dokončite zobrazené bezpečnostné overenie.'
          : attempt.status === 'recoverable'
            ? 'Obnovte bezpečnostné overenie a dokončite ho znova.'
            : 'Počkajte, kým sa bezpečnostné overenie pripraví.',
      );
    }
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

  return <form onSubmit={submit} className="space-y-4"><label className="space-y-2 text-sm text-slate-300"><span>E-mail</span><Input required type="email" name="email" autoComplete="username" /></label><label className="space-y-2 text-sm text-slate-300"><span>Heslo</span><Input required minLength={16} type="password" name="password" autoComplete="current-password" /></label><TurnstileWidget ref={turnstile.widgetRef} siteKey={siteKey} action="admin_login" onToken={turnstile.onToken} onStateChange={turnstile.onStateChange} />{siteKey && <TurnstileStatus phase={turnstile.phase} onRecover={turnstile.recover} />}<Button type="submit" disabled={turnstile.pending || (Boolean(siteKey) && !turnstile.canSubmit)} className="w-full">{turnstile.pending ? 'Overujeme…' : 'Prihlásiť sa'}</Button>{error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}</form>;
}
