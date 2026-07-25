'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UnlockResponse {
  checkEmailUrl?: string;
  emailSent?: boolean;
  error?: string;
  errorId?: string;
}

export function UnlockForm({ token }: { token: string }) {
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTurnstileToken = useCallback((value: string | null) => setTurnstileToken(value), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (siteKey && !turnstileToken) {
      setError('Dokončite bezpečnostné overenie.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          name: form.get('name'),
          company: form.get('company'),
          marketingConsent: form.get('marketingConsent') === 'on',
          turnstileToken,
        }),
      });
      const data = (await response.json()) as UnlockResponse;
      if (!response.ok || !data.checkEmailUrl) throw new Error(`${data.error ?? 'E-mail sa nepodarilo odoslať.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      const email = String(form.get('email') ?? '');
      sessionStorage.setItem(`dcz-audit-email:${token}`, email);
      router.push(data.checkEmailUrl);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'E-mail sa nepodarilo odoslať.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
          <span>E-mail, na ktorý pošleme celý výsledok *</span>
          <Input required type="email" name="email" autoComplete="email" placeholder="meno@firma.sk" />
          <span className="block text-xs text-slate-500">Firemný e-mail odporúčame, ale nie je podmienkou.</span>
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Meno</span>
          <Input name="name" autoComplete="name" placeholder="Vaše meno" />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Firma</span>
          <Input name="company" autoComplete="organization" placeholder="Názov firmy" />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm leading-6 text-slate-400 transition-colors duration-200 hover:border-white/15">
        <input type="checkbox" name="marketingConsent" className="mt-1 size-4 accent-blue-500" />
        <span>Súhlasím s občasnými praktickými tipmi od DCZ. Tento súhlas nie je podmienkou doručenia výsledku.</span>
      </label>
      <TurnstileWidget siteKey={siteKey} onToken={onTurnstileToken} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Odosielame bezpečný odkaz…' : 'Poslať celý výsledok e-mailom'}
      </Button>
      <p className="text-xs leading-5 text-slate-500">
        Celý report sa otvorí až cez odkaz v e-maile. Spracovanie údajov opisujú{' '}
        <Link href="/privacy" className="focus-ring rounded text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200">zásady súkromia</Link>.
      </p>
      {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
    </form>
  );
}
