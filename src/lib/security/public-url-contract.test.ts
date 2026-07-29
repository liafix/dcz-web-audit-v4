import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const LOCAL_REDIRECT_ROUTES = [
  'src/app/access/[token]/confirm/route.ts',
  'src/app/book/[token]/confirm/route.ts',
  'src/app/brief/[token]/book/confirm/route.ts',
  'src/app/unsubscribe/[token]/confirm/route.ts',
  'src/app/api/admin/logout/route.ts',
] as const;

const PUBLIC_LINK_BUILDERS = [
  'src/app/api/audit/[token]/unlock/route.ts',
  'src/app/api/audit/[token]/resend/route.ts',
  'src/app/api/audit/[token]/brief/route.ts',
  'src/lib/follow-up/processor.ts',
] as const;

describe('canonical public URL source contract', () => {
  it('does not base identified local public redirects on request-derived origins', async () => {
    for (const path of LOCAL_REDIRECT_ROUTES) {
      const source = await readFile(path, 'utf8');
      expect(source, path).toContain('appUrl()');
      expect(source, path).not.toMatch(/new URL\([^)]*,\s*request\.url\s*\)/s);
      expect(source, path).not.toContain('request.nextUrl.origin');
      expect(source, path).not.toMatch(/x-forwarded-(host|proto)/i);
    }
  });

  it('keeps identified email and public-token links anchored to appUrl()', async () => {
    for (const path of PUBLIC_LINK_BUILDERS) {
      expect(await readFile(path, 'utf8'), path).toContain('appUrl()');
    }
  });
});
