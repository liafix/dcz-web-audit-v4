import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('lead email delivery claim contract', () => {
  it('uses one conditional UPDATE RETURNING and never a read-then-write claim', async () => {
    const source = await readFile('src/lib/db/queries.ts', 'utf8');
    const start = source.indexOf('export async function claimLeadEmailDelivery');
    const end = source.indexOf('export async function markLeadVerified', start);
    const claim = source.slice(start, end);

    expect(claim).toContain('.update(leads)');
    expect(claim).toContain('isNull(leads.emailVerifiedAt)');
    expect(claim).toContain('isNull(leads.emailLastSentAt)');
    expect(claim).toContain("eq(leads.emailDeliveryStatus, 'failed')");
    expect(claim).toContain("eq(leads.emailDeliveryStatus, 'pending')");
    expect(claim).toContain('lt(leads.emailLastSentAt, abandonedBefore)');
    expect(claim).toContain('.returning()');
    expect(claim).not.toContain('.select(');
  });

  it('preserves an already verified lead during unlock upsert', async () => {
    const source = await readFile('src/lib/db/queries.ts', 'utf8');
    expect(source).toContain(
      'stage: sql`case when ${leads.emailVerifiedAt} is not null then ${leads.stage} else ${input.stage} end`',
    );
  });
});
