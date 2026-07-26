import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-dcz-geist',
  fallback: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
});

const metadataBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
const preventIndexing =
  process.env.NODE_ENV !== 'production' ||
  Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
  process.env.NEXT_PUBLIC_PREVENT_INDEXING === 'true';

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: 'DCZ WebAudit — predbežná diagnostika webu',
    template: '%s — DCZ WebAudit',
  },
  description:
    'Získajte vysvetliteľný predbežný audit techniky, SEO, dôvery a konverznej cesty vášho webu.',
  robots: preventIndexing ? { index: false, follow: false, nocache: true } : undefined,
  openGraph: {
    type: 'website',
    locale: 'sk_SK',
    siteName: 'DCZ WebAudit',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sk" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
