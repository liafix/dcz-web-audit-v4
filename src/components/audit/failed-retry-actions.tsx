'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, buttonClass } from '@/components/ui/button';

export function FailedRetryActions({ token, retryable }: { token: string; retryable: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/audit/${encodeURIComponent(token)}/process`, { method: 'POST' });
      const data = (await response.json().catch(() => ({}))) as { error?: string; errorId?: string };
      if (!response.ok && response.status !== 409) throw new Error(`${data.error ?? 'Audit sa nepodarilo spustiť.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      router.push(`/audit/${encodeURIComponent(token)}/progress`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Audit sa nepodarilo spustiť.');
      setPending(false);
    }
  }

  return <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
    {retryable && <Button type="button" disabled={pending} onClick={() => void retry()}>{pending ? 'Spúšťame…' : 'Skúsiť audit znova'}</Button>}
    <Link className={buttonClass('secondary')} href={`/contact?audit=${encodeURIComponent(token)}`}>Požiadať o manuálnu kontrolu</Link>
    {error && <p role="alert" className="w-full text-sm text-red-200">{error}</p>}
  </div>;
}
