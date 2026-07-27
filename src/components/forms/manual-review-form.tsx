'use client';

import { useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { useTurnstileAttempt } from '@/components/forms/use-turnstile-attempt';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

export function ManualReviewForm({ token }: { token: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstileAttempt();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const attempt = turnstile.begin(Boolean(siteKey));
    if (attempt.status === 'busy') return;
    if (attempt.status === 'missing') return setError('Dokončite viditeľné bezpečnostné overenie a odošlite formulár znova.');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/manual-review`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          name: form.get('name'),
          company: form.get('company'),
          phone: form.get('phone'),
          message: form.get('message'),
          turnstileToken: attempt.token,
        }),
      });
      const data = (await response.json()) as { error?: string; errorId?: string };
      if (!response.ok) throw new Error(`${data.error ?? 'Žiadosť sa nepodarilo odoslať.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      setSuccess(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Žiadosť sa nepodarilo odoslať.');
      turnstile.release(true);
    }
  }

  const challengeIssue = (text: string) => {
    turnstile.clearChallenge();
    setError(text);
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/8 p-6">
        <h2 className="text-xl font-semibold text-white">Žiadosť sme prijali</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">DCZ dostalo kontext, správu aj prioritné zistenia z auditu. Odpoveď zvyčajne posielame počas najbližších pracovných dní; nejde o garantovanú lehotu. Pri urgentnej požiadavke napíšte na info@dcz.sk.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300"><span>Meno *</span><Input required name="name" autoComplete="name" /></label>
        <label className="space-y-2 text-sm text-slate-300"><span>E-mail *</span><Input required type="email" name="email" autoComplete="email" /></label>
        <label className="space-y-2 text-sm text-slate-300"><span>Firma</span><Input name="company" autoComplete="organization" /></label>
        <label className="space-y-2 text-sm text-slate-300"><span>Telefón</span><Input name="phone" autoComplete="tel" /></label>
      </div>
      <label className="space-y-2 text-sm text-slate-300"><span>Čo potrebujete vyriešiť? *</span><Textarea required name="message" placeholder="Napíšte cieľ, problém alebo termín projektu." /></label>
      <TurnstileWidget
        ref={turnstile.widgetRef}
        siteKey={siteKey}
        onToken={turnstile.onToken}
        onExpired={() => challengeIssue('Platnosť bezpečnostného overenia vypršala. Dokončite ho znova.')}
        onError={() => challengeIssue('Bezpečnostné overenie sa nepodarilo načítať. Skúste ho znova.')}
        onTimeout={() => challengeIssue('Bezpečnostné overenie vypršalo pre nečinnosť. Dokončite ho znova.')}
      />
      <Button type="submit" disabled={turnstile.pending} className="w-full">{turnstile.pending ? 'Odosielame…' : 'Požiadať o manuálnu kontrolu'}</Button>
      {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
    </form>
  );
}
