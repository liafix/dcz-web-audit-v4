import type { AuditRecord } from '@/lib/db/schema';

export function calculateLeadScore(
  audit: AuditRecord,
  input: { company?: string | null; phone?: string | null; primaryGoal?: string | null },
  source: 'audit_unlock' | 'manual_review',
): number {
  let score = source === 'manual_review' ? 70 : 42;
  if (input.company) score += 10;
  if (input.phone) score += 12;
  if (input.primaryGoal && input.primaryGoal.length >= 20) score += 8;
  if ((audit.overallScore ?? 100) < 55) score += 8;
  return Math.min(100, score);
}
