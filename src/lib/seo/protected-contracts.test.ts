import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('protected funnel and indexing contracts', () => {
  it('preserves the audit start and Turnstile presentation contracts', async () => {
    const auditForm = await readFile('src/components/forms/audit-form.tsx', 'utf8');
    const turnstile = await readFile('src/components/forms/turnstile-widget.tsx', 'utf8');
    const rootLayout = await readFile('src/app/layout.tsx', 'utf8');

    expect(auditForm).toContain("fetch('/api/audit/start'");
    expect(auditForm).toContain('router.push(`/audit/${encodeURIComponent(data.token)}/progress`)');
    expect(auditForm).toContain('ref={turnstile.widgetRef}');
    expect(auditForm).toContain('onToken={turnstile.onToken}');
    expect(auditForm).toContain('onStateChange={turnstile.onStateChange}');
    expect(auditForm).toContain('action="audit_start"');
    expect(auditForm).toContain('responsive={isHero}');
    expect(rootLayout).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__dczTurnstileReady');
    expect(rootLayout).toContain('strategy="beforeInteractive"');
    expect(rootLayout).toContain('turnstileSiteKey()');
    expect(rootLayout.match(/cloudflare-turnstile-script/g)).toHaveLength(1);
    expect(turnstile).not.toContain("from 'next/script'");
    expect(turnstile).not.toContain("querySelector('iframe')");
    expect(turnstile).not.toContain('&retry=');
    expect(turnstile).toContain('tokenCallbackRef.current(token)');
    expect(turnstile).toContain("publishState('verified')");
    expect(turnstile).toContain("'expired-callback': () => {");
    expect(turnstile).toContain("'error-callback': (code) => {");
    expect(turnstile).toContain("'timeout-callback': () => {");
    expect(turnstile).toContain('window.turnstile.reset(owned.id)');
    expect(turnstile).toContain('widgetRef.current = null');
    expect(turnstile).toContain("retry: 'auto'");
    expect(turnstile).toContain("'refresh-expired': 'auto'");
    expect(turnstile).toContain("'refresh-timeout': 'auto'");
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

  it('limits reload persistence to the non-sensitive audited URL field', async () => {
    const auditForm = await readFile('src/components/forms/audit-form.tsx', 'utf8');
    expect(auditForm).toContain("export const AUDIT_URL_RECOVERY_KEY = 'dcz:audit-url-recovery:v1'");
    expect(auditForm).toContain('beforeReload: persistAuditUrlForRecovery');
    expect(auditForm).toContain('window.sessionStorage.removeItem(AUDIT_URL_RECOVERY_KEY)');
    expect(auditForm).toContain(
      'window.sessionStorage.setItem(AUDIT_URL_RECOVERY_KEY, recoveryUrl)',
    );
    expect(auditForm.match(/sessionStorage\.setItem/g)).toHaveLength(1);

    for (const path of [
      'src/components/forms/unlock-form.tsx',
      'src/components/forms/resend-access-form.tsx',
      'src/components/forms/manual-review-form.tsx',
      'src/components/admin/admin-login-form.tsx',
    ]) {
      const source = await readFile(path, 'utf8');
      expect(source, path).not.toContain('sessionStorage');
      expect(source, path).not.toContain('beforeReload');
      expect(source, path).not.toContain('AUDIT_URL_RECOVERY_KEY');
    }
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
