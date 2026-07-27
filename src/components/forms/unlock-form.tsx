'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { useTurnstileAttempt } from '@/components/forms/use-turnstile-attempt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UnlockResponse {
  checkEmailUrl?: string;
  emailSent?: boolean;
  error?: string;
  errorId?: string;
  code?: string;
}

export function UnlockForm({ token, funnelVerified = false }: { token: string; funnelVerified?: boolean }) {
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [verificationRequired, setVerificationRequired] = useState(!funnelVerified);
  const [error, setError] = useState<string | null>(null);
  const turnstile = useTurnstileAttempt();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const attempt = turnstile.begin(verificationRequired && Boolean(siteKey));
    if (attempt.status === 'busy') return;
    if (attempt.status === 'missing') return setError('Dokončite viditeľné bezpečnostné overenie a formulár odošlite znova.');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/unlock`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          name: form.get('name'),
          company: form.get('company'),
          marketingConsent: form.get('marketingConsent') === 'on',
          website: form.get('website'),
          turnstileToken: attempt.token,
        }),
      });
      const data = (await response.json()) as UnlockResponse;
      if (response.status === 428 && data.code === 'verification_required') {
        setVerificationRequired(true);
        setError(data.error ?? 'Platnosť bezpečnostného overenia vypršala. Dokončite nové overenie a formulár odošlite znova.');
        turnstile.release(true);
        return;
      }
      if (!response.ok || !data.checkEmailUrl) throw new Error(`${data.error ?? 'E-mail sa nepodarilo odoslať.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      const email = String(form.get('email') ?? '');
      sessionStorage.setItem(`dcz-audit-email:${token}`, email);
      router.push(data.checkEmailUrl);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'E-mail sa nepodarilo odoslať.');
      turnstile.release(true);
    }
  }

  const challengeIssue = (message: string) => {
    turnstile.clearChallenge();
    setError(message);
  };

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
      <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" name="website" />
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm leading-6 text-slate-400 transition-colors duration-200 hover:border-white/15">
        <input type="checkbox" name="marketingConsent" className="mt-1 size-4 accent-blue-500" />
        <span>Súhlasím s občasnými praktickými tipmi od DCZ. Tento súhlas nie je podmienkou doručenia výsledku.</span>
      </label>
      {verificationRequired ? (
        <div className="space-y-2">
          <p className="text-sm leading-6 text-amber-100">
            Dokončite nové bezpečnostné overenie. Po overení formulár odošlite znova.
          </p>
          <TurnstileWidget
            ref={turnstile.widgetRef}
            siteKey={siteKey}
            onToken={turnstile.onToken}
            onExpired={() => challengeIssue('Platnosť bezpečnostného overenia vypršala. Dokončite ho znova.')}
            onError={() => challengeIssue('Bezpečnostné overenie sa nepodarilo načítať. Skúste ho znova.')}
            onTimeout={() => challengeIssue('Bezpečnostné overenie vypršalo pre nečinnosť. Dokončite ho znova.')}
          />
        </div>
      ) : (
        <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100">
          Bezpečnostné overenie z úvodného kroku je stále platné pre tento audit.
        </p>
      )}
      <Button type="submit" disabled={turnstile.pending} className="w-full">
        {turnstile.pending ? 'Odosielame bezpečný odkaz…' : 'Poslať celý výsledok e-mailom'}
      </Button>
      <p className="text-xs leading-5 text-slate-500">
        Celý report sa otvorí až cez odkaz v e-maile. Spracovanie údajov opisujú{' '}
        <Link href="/privacy" className="focus-ring rounded text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200">zásady súkromia</Link>.
      </p>
      {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
    </form>
  );
}
