'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StartResponse { token?: string; error?: string; errorId?: string; }

export function AuditForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
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

  return <form onSubmit={submit} className="space-y-4" noValidate>
    <div className={compact ? 'grid gap-3 md:grid-cols-[1fr_auto]' : 'space-y-3'}><div><label htmlFor="audit-url" className="sr-only">URL webstránky</label><Input id="audit-url" inputMode="url" autoComplete="url" required value={url} onFocus={() => track('url_field_focused')} onChange={(event) => setUrl(event.target.value)} placeholder="https://vasweb.sk" aria-describedby={error ? 'audit-error' : 'audit-help'} /><input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={website} onChange={(event) => setWebsite(event.target.value)} name="website" /></div><Button type="submit" disabled={pending} className={compact ? 'md:min-w-52' : 'w-full'}>{pending ? 'Spúšťame diagnostiku…' : 'Analyzovať obchodné bariéry'}</Button></div>
    <TurnstileWidget siteKey={siteKey} onToken={onTurnstileToken} />
    <p id="audit-help" className="text-xs leading-5 text-slate-500">Kontrolujeme iba verejne dostupné signály titulnej stránky. Neprihlasujeme sa, neodosielame formuláre ani nevykonávame zásahy do webu.</p>
    {error && <p id="audit-error" role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
  </form>;
}
