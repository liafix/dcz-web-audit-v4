import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import { turnstileSiteKey } from '@/lib/env';
import {
  SITE_LOCALE,
  SITE_NAME,
  isIndexingPrevented,
  metadataBaseUrl,
} from '@/lib/seo/config';
import { HOME_SEO, renderedTitle } from '@/lib/seo/metadata';
import './globals.css';

const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-dcz-geist',
  fallback: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
});

const preventIndexing = isIndexingPrevented();
const defaultTitle = renderedTitle(HOME_SEO.title);
const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_BRIDGE_ID = 'cloudflare-turnstile-readiness-bridge';
const TURNSTILE_READY_EVENT = 'dcz:turnstile-ready';
const TURNSTILE_ERROR_EVENT = 'dcz:turnstile-error';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__dczTurnstileReady';
const TURNSTILE_BRIDGE_SOURCE = `
(function () {
  if (window.__dczTurnstileBridge) return;
  var bridge = { status: 'loading' };
  window.__dczTurnstileBridge = bridge;
  window.__dczTurnstileReady = function () {
    bridge.status = window.turnstile ? 'ready' : 'failed';
    window.dispatchEvent(new Event(
      bridge.status === 'ready' ? '${TURNSTILE_READY_EVENT}' : '${TURNSTILE_ERROR_EVENT}'
    ));
  };
  window.addEventListener('error', function (event) {
    var target = event.target;
    if (!target || target.id !== '${TURNSTILE_SCRIPT_ID}') return;
    bridge.status = 'failed';
    window.dispatchEvent(new Event('${TURNSTILE_ERROR_EVENT}'));
  }, true);
})();
`;

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_SEO.description,
  robots: preventIndexing ? { index: false, follow: false, nocache: true } : undefined,
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: defaultTitle,
    description: HOME_SEO.description,
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'DCZ WebAudit – predbežná diagnostika verejných signálov webu',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: HOME_SEO.description,
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'DCZ WebAudit – predbežná diagnostika verejných signálov webu',
    }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const turnstileConfigured = Boolean(turnstileSiteKey());

  return (
    <html lang="sk" className={geist.variable}>
      <body>{children}</body>
      {turnstileConfigured ? (
        <>
          <Script
            id={TURNSTILE_BRIDGE_ID}
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: TURNSTILE_BRIDGE_SOURCE }}
          />
          <Script
            id={TURNSTILE_SCRIPT_ID}
            src={TURNSTILE_SCRIPT_URL}
            strategy="beforeInteractive"
          />
        </>
      ) : null}
    </html>
  );
}
