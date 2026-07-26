'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StartResponse { token?: string; error?: string; errorId?: string; }

export function AuditForm({
  compact = false,
  variant = 'default',
}: {
  compact?: boolean;
  variant?: 'default' | 'hero';
}) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isHero = variant === 'hero';
  const isCompact = compact || isHero;
  const onTurnstileToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  function currentReferrerHost(): string | null {
    try { return document.referrer ? new URL(document.referrer).hostname : null; } catch { return null; }
  }

  function track(event: 'url_field_focused' | 'audit_submit_attempted') {
    void fetch('/api/events/landing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event }), keepalive: true }).catch(() => undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); track('audit_submit_attempted');
    if (siteKey && !turnstileToken) return setError('Dokončite bezpečnostné overenie.');
    setPending(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const response = await fetch('/api/audit/start', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url, website, turnstileToken,
          utmSource: searchParams.get('utm_source'), utmMedium: searchParams.get('utm_medium'), utmCampaign: searchParams.get('utm_campaign'),
          referrerHost: currentReferrerHost(),
        }),
      });
      const data = (await response.json()) as StartResponse;
      if (!response.ok || !data.token) throw new Error(`${data.error ?? 'Audit sa nepodarilo spustiť.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      router.push(`/audit/${encodeURIComponent(data.token)}/progress`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Audit sa nepodarilo spustiť.'); setPending(false);
    }
  }

  return <form onSubmit={submit} className={isHero ? 'premium-audit-form' : 'space-y-4'} noValidate aria-busy={pending}>
    <div className={isHero ? 'premium-audit-form__row' : isCompact ? 'grid gap-3 md:grid-cols-[1fr_auto]' : 'space-y-3'}>
      <div className={isHero ? 'premium-audit-form__field' : undefined}>
        <label htmlFor="audit-url" className="sr-only">URL webstránky</label>
        {isHero && <svg className="premium-audit-form__globe" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M3.5 12h17M12 3c2.2 2.45 3.3 5.45 3.3 9S14.2 18.55 12 21c-2.2-2.45-3.3-5.45-3.3-9S9.8 5.45 12 3Z" stroke="currentColor" strokeWidth="1.6" /></svg>}
        <Input id="audit-url" inputMode="url" autoComplete="url" required value={url} onFocus={() => track('url_field_focused')} onChange={(event) => setUrl(event.target.value)} placeholder="https://vasweb.sk" aria-describedby={error ? 'audit-error' : 'audit-help'} className={isHero ? 'premium-audit-form__input' : undefined} />
        <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={website} onChange={(event) => setWebsite(event.target.value)} name="website" />
      </div>
      <Button type="submit" disabled={pending} variant={isHero ? 'accent' : 'primary'} className={isHero ? 'premium-audit-form__submit' : isCompact ? 'md:min-w-52' : 'w-full'}>
        {pending ? 'Spúšťame diagnostiku…' : 'Analyzovať obchodné bariéry'}
        {isHero && !pending && <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" className="premium-button-arrow"><path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>}
      </Button>
    </div>
    <TurnstileWidget siteKey={siteKey} onToken={onTurnstileToken} responsive={isHero} />
    <p id="audit-help" className={isHero ? 'premium-audit-form__help' : 'text-xs leading-5 text-slate-500'}>Kontrolujeme iba verejne dostupné signály titulnej stránky. Neprihlasujeme sa, neodosielame formuláre ani nevykonávame zásahy do webu.</p>
    {error && <p id="audit-error" role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
  </form>;
}
