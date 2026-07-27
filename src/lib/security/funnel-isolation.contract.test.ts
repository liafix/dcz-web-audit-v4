import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('verified funnel isolation', () => {
  it.each([
    ['resend', 'src/app/api/audit/[token]/resend/route.ts', 'src/components/forms/resend-access-form.tsx'],
    ['manual review', 'src/app/api/audit/[token]/manual-review/route.ts', 'src/components/forms/manual-review-form.tsx'],
    ['admin login', 'src/app/api/admin/login/route.ts', 'src/components/admin/admin-login-form.tsx'],
  ])('keeps %s separately Turnstile-protected', async (_label, routePath, formPath) => {
    const [route, form] = await Promise.all([
      readFile(routePath, 'utf8'),
      readFile(formPath, 'utf8'),
    ]);
    expect(route).toContain('verifyTurnstile(');
    expect(route).toContain('assertSameOrigin(request)');
    expect(route).not.toContain('hasVerifiedFunnelSession');
    expect(form).toContain('<TurnstileWidget');
    expect(form).toContain('useTurnstileAttempt');
  });

  it('does not use the funnel session as report access', async () => {
    const reportAccess = await readFile('src/lib/auth/report-access.ts', 'utf8');
    const revenueAccess = await readFile('src/lib/revenue/access.ts', 'utf8');
    expect(reportAccess).not.toContain('funnel');
    expect(revenueAccess).toContain('hasReportAccess');
    expect(revenueAccess).not.toContain('hasVerifiedFunnelSession');
  });
});
