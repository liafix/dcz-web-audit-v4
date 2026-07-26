import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('protected funnel and indexing contracts', () => {
  it('preserves the audit start and Turnstile presentation contracts', async () => {
    const auditForm = await readFile('src/components/forms/audit-form.tsx', 'utf8');
    const turnstile = await readFile('src/components/forms/turnstile-widget.tsx', 'utf8');

    expect(auditForm).toContain("fetch('/api/audit/start'");
    expect(auditForm).toContain('router.push(`/audit/${encodeURIComponent(data.token)}/progress`)');
    expect(auditForm).toContain(
      '<TurnstileWidget siteKey={siteKey} onToken={onTurnstileToken} responsive={isHero} />',
    );
    expect(turnstile).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
    expect(turnstile).toContain("callback: (token) => onToken(token)");
    expect(turnstile).toContain("'expired-callback': () => onToken(null)");
    expect(turnstile).toContain("'error-callback': () => onToken(null)");
  });

  it('preserves private X-Robots-Tag and no-store route groups', async () => {
    const config = await readFile('next.config.ts', 'utf8');
    for (const prefix of [
      "'/audit/:path*'",
      "'/access/:path*'",
      "'/admin/:path*'",
      "'/brief/:path*'",
      "'/book/:path*'",
      "'/unsubscribe/:path*'",
      "'/api/:path*'",
    ]) {
      expect(config).toContain(prefix);
    }
    expect(config).toContain("'X-Robots-Tag', value: 'noindex, nofollow, noarchive'");
    expect(config).toContain("'Cache-Control', value: 'no-store, private'");
  });

  it('wires every indexable public page to the environment-aware metadata helper', async () => {
    for (const path of [
      'src/app/page.tsx',
      'src/app/methodology/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/contact/page.tsx',
    ]) {
      expect(await readFile(path, 'utf8')).toContain('buildPublicMetadata');
    }
  });
});

