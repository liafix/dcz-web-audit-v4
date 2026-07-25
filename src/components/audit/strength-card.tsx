import { Card, CardContent } from '@/components/ui/card';
import type { AuditStrength } from '@/lib/audit/types';

export function StrengthCard({ strength }: { strength: AuditStrength }) {
  return (
    <Card className="border-emerald-300/15">
      <CardContent>
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200">✓</span>
        <h3 className="mt-4 font-semibold text-white">{strength.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{strength.evidence}</p>
      </CardContent>
    </Card>
  );
}
