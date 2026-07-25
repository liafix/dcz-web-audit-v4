'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BookingStatusForm({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function update(status: 'booked' | 'cancelled') {
    setPending(true); setError(null);
    try {
      const response = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/booking`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const data = await response.json() as { error?: string; errorId?: string };
      if (!response.ok) throw new Error(`${data.error ?? 'Rezerváciu sa nepodarilo aktualizovať.'}${data.errorId ? ` ID: ${data.errorId}` : ''}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Rezerváciu sa nepodarilo aktualizovať.');
    } finally { setPending(false); }
  }
  return <div className="mt-4 space-y-3"><div className="flex flex-col gap-2"><Button type="button" disabled={pending || currentStatus === 'booked'} onClick={() => update('booked')}>Označiť ako rezervované</Button><Button type="button" variant="secondary" disabled={pending || currentStatus === 'cancelled'} onClick={() => update('cancelled')}>Označiť ako zrušené</Button></div>{error && <p role="alert" className="text-sm text-red-200">{error}</p>}</div>;
}
