import Link from 'next/link';
import type { AuditRecord } from '@/lib/db/schema';

export function AuditTable({ audits }: { audits: AuditRecord[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8">
      <table className="min-w-full divide-y divide-white/8 text-left text-sm">
        <thead className="bg-white/[0.03] text-xs tracking-wide text-slate-500 uppercase"><tr><th className="px-4 py-3">Web</th><th className="px-4 py-3">Stav</th><th className="px-4 py-3">Skóre</th><th className="px-4 py-3">Vytvorený</th></tr></thead>
        <tbody className="divide-y divide-white/6">
          {audits.map((audit) => (
            <tr key={audit.id} className="hover:bg-white/[0.025]">
              <td className="px-4 py-4"><Link className="font-medium text-white hover:text-blue-300" href={`/admin/audits/${audit.id}`}>{audit.origin}</Link><span className="mt-1 block max-w-sm truncate text-xs text-slate-600">{audit.targetUrl}</span></td>
              <td className="px-4 py-4 text-slate-300">{audit.status}</td>
              <td className="px-4 py-4 text-slate-300">{audit.overallScore ?? '—'}</td>
              <td className="px-4 py-4 text-slate-500">{audit.createdAt.toLocaleString('sk-SK')}</td>
            </tr>
          ))}
          {audits.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Zatiaľ nie sú uložené žiadne audity.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
