import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-mark';
import { buttonClass } from '@/components/ui/button';

const links = [['Metodika', '/methodology'], ['Súkromie', '/privacy'], ['Kontakt', '/contact']] as const;
export function Header() {
  return (
    <header className="premium-site-header">
      <div className="premium-site-header__panel">
        <Link className="focus-ring rounded-xl" href="/" aria-label="DCZ WebAudit – domov">
          <BrandMark priority decorative />
        </Link>
        <nav className="premium-site-header__nav" aria-label="Hlavná navigácia">
          {links.map(([label, href]) => (
            <Link key={href} className="premium-site-header__link focus-ring" href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="premium-site-header__actions">
          <Link className={`${buttonClass('accent')} premium-site-header__cta`} href="/#audit-url">
            Spustiť audit
            <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" className="premium-button-arrow">
              <path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </Link>
          <details className="premium-site-header__menu">
            <summary className="premium-site-header__menu-trigger focus-ring" aria-label="Otvoriť menu">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
            </summary>
            <nav className="premium-site-header__mobile-nav" aria-label="Mobilná navigácia">
              {links.map(([label, href]) => (
                <Link key={href} className="premium-site-header__mobile-link focus-ring" href={href}>
                  {label}
                </Link>
              ))}
              <Link className={`${buttonClass('accent')} premium-site-header__mobile-cta`} href="/#audit-url">
                Spustiť audit
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
