import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertSameOrigin } from '@/lib/security/request-origin';

const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PREVENT_INDEXING: process.env.NEXT_PUBLIC_PREVENT_INDEXING,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

describe('assertSameOrigin', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://dczweb.com';
    process.env.NEXT_PUBLIC_PREVENT_INDEXING = 'false';
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('accepts a matching origin', () => {
    const request = new Request('https://dczweb.com/access/x/confirm', {
      method: 'POST',
      headers: { origin: 'https://dczweb.com' },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it('rejects a request without browser origin context', () => {
    const request = new Request('https://dczweb.com/access/x/confirm', { method: 'POST' });
    expect(() => assertSameOrigin(request)).toThrow();
  });

  it('rejects a foreign origin', () => {
    const request = new Request('https://dczweb.com/access/x/confirm', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    });
    expect(() => assertSameOrigin(request)).toThrow();
  });

  it('does not trust a forged request URL origin in live production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const request = new Request('https://evil.example/access/x/confirm', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    });
    expect(() => assertSameOrigin(request)).toThrow();
  });

  it('allows the request URL origin for non-live staging previews', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_PREVENT_INDEXING = 'true';
    const request = new Request('https://staging.example/access/x/confirm', {
      method: 'POST',
      headers: { origin: 'https://staging.example' },
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });
});
