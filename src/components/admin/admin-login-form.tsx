'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLoginForm() {
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTurnstileToken = useCallback((value: string | null) => setTurnstileToken(value), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (siteKey && !turnstileToken) return setError('Dokončite bezpečnostné overenie.');
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password'), turnstileToken }) });
      const data = (await response.json()) as { error?: string; errorId?: string };
      if (!response.ok) throw new Error(`${data.error ?? 'Prihlásenie zlyhalo.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      router.replace('/admin'); router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Prihlásenie zlyhalo.'); setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4"><label className="space-y-2 text-sm text-slate-300"><span>E-mail</span><Input required type="email" name="email" autoComplete="username" /></label><label className="space-y-2 text-sm text-slate-300"><span>Heslo</span><Input required minLength={16} type="password" name="password" autoComplete="current-password" /></label><TurnstileWidget siteKey={siteKey} onToken={onTurnstileToken} /><Button type="submit" disabled={pending} className="w-full">{pending ? 'Overujeme…' : 'Prihlásiť sa'}</Button>{error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}</form>;
}
