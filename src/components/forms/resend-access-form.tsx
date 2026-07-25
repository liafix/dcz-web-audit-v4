'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { TurnstileWidget } from '@/components/forms/turnstile-widget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ResendAccessForm({ token }: { token: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const onTurnstileToken = useCallback((value: string | null) => setTurnstileToken(value), []);

  useEffect(() => {
    setEmail(sessionStorage.getItem(`dcz-audit-email:${token}`) ?? '');
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (siteKey && !turnstileToken) return setError('Dokončite bezpečnostné overenie.');
    setPending(true);
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/resend`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, turnstileToken }),
      });
      const data = (await response.json()) as { error?: string; errorId?: string };
      if (!response.ok) throw new Error(`${data.error ?? 'Odkaz sa nepodarilo odoslať.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      setMessage('Nový odkaz sme odoslali. Skontrolujte aj priečinok Spam alebo Reklamy.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Odkaz sa nepodarilo odoslať.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="space-y-2 text-sm text-slate-300">
        <span>Odoslať odkaz znova</span>
        <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="meno@firma.sk" />
      </label>
      <TurnstileWidget siteKey={siteKey} onToken={onTurnstileToken} />
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">{pending ? 'Odosielame…' : 'Odoslať nový odkaz'}</Button>
      {message && <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-100">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
    </form>
  );
}
