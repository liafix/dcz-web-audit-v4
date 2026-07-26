import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-mark';

const footerLinks = [
  ['Metodika', '/methodology'],
  ['Súkromie', '/privacy'],
  ['Kontakt', '/contact'],
  ['DCZ.sk', 'https://dcz.sk'],
] as const;

export function Footer() {
  return (
    <footer className="premium-site-footer">
      <div className="premium-site-footer__panel">
        <div className="premium-site-footer__brand">
          <BrandMark variant="footer" />
          <p className="premium-site-footer__description">
            Predbežná diagnostika verejných signálov titulnej stránky bez zásahov do webu.
            Výsledok nenahrádza manuálny technický, právny ani obchodný audit.
          </p>
          <div className="premium-site-footer__company">
            <span className="premium-site-footer__company-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3.5 19 6v5.4c0 4.2-2.7 7.7-7 9.1-4.3-1.4-7-4.9-7-9.1V6l7-2.5Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m9.2 12 1.8 1.8 3.9-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
              </svg>
            </span>
            <address>
              <span>AesDC s. r. o. · IČO 55408575</span>
              <span>
                Štvrť SNP 132/23, 914 51 Trenčianske Teplice
                <span aria-hidden="true"> · </span>
                <a href="mailto:info@dcz.sk">info@dcz.sk</a>
              </span>
            </address>
          </div>
        </div>

        <nav className="premium-site-footer__nav" aria-label="Navigácia v pätičke">
          {footerLinks.map(([label, href]) => (
            <Link key={href} href={href} className="premium-site-footer__link focus-ring">
              <span>{label}</span>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
                <path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
              </svg>
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
