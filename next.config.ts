import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const preventIndexing =
  !isProduction ||
  Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
  process.env.NEXT_PUBLIC_PREVENT_INDEXING === 'true';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    const globalHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: csp },
      ...(isProduction
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
        : []),
      ...(preventIndexing ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] : []),
    ];
    const privateHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'no-store, private' },
    ];
    return [
      { source: '/(.*)', headers: globalHeaders },
      { source: '/audit/:path*', headers: privateHeaders },
      { source: '/access/:path*', headers: privateHeaders },
      { source: '/admin/:path*', headers: privateHeaders },
      { source: '/brief/:path*', headers: privateHeaders },
      { source: '/book/:path*', headers: privateHeaders },
      { source: '/unsubscribe/:path*', headers: privateHeaders },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
