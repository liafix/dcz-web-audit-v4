import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('landing audit form contract', () => {
  it('preserves the working audit-start request and response contract', async () => {
    const source = await readFile('src/components/forms/audit-form.tsx', 'utf8');
    const requiredSnippets = [
      "fetch('/api/audit/start'",
      "method: 'POST'",
      'url, website, turnstileToken: attempt.token,',
      "utmSource: searchParams.get('utm_source')",
      "utmMedium: searchParams.get('utm_medium')",
      "utmCampaign: searchParams.get('utm_campaign')",
      'referrerHost: currentReferrerHost()',
      'data.errorId',
      'router.push(`/audit/${encodeURIComponent(data.token)}/progress`)',
      "track('url_field_focused')",
      "track('audit_submit_attempted')",
    ];

    for (const snippet of requiredSnippets) {
      expect(source).toContain(snippet);
    }
  });

  it('retains form semantics, Turnstile and backwards-compatible presentation props', async () => {
    const source = await readFile('src/components/forms/audit-form.tsx', 'utf8');
    const startPage = await readFile('src/app/audit/start/page.tsx', 'utf8');

    expect(source).toContain('compact?: boolean');
    expect(source).toContain("variant?: 'default' | 'hero'");
    expect(source).toContain('id="audit-url"');
    expect(source).toContain('id="audit-help"');
    expect(source).toContain('id="audit-error"');
    expect(source).toContain('name="website"');
    expect(source).toContain('ref={turnstile.widgetRef}');
    expect(source).toContain('onToken={turnstile.onToken}');
    expect(source).toContain('responsive={isHero}');
    expect(startPage).toContain('<AuditForm />');
  });
});
