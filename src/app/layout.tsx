import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
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
  return (
    <html lang="sk" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
