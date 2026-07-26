import { AuditForm } from '@/components/forms/audit-form';

const trustItems = [
  'Executive preview pred e-mailom',
  'Súkromný noindex report',
  'Žiadne falošné garancie tržieb',
] as const;

export function HeroAuditCard() {
  return (
    <div className="premium-audit-wrap premium-hero-enter premium-hero-enter--card">
      <div className="premium-audit-card">
        <span className="premium-audit-card__beam" aria-hidden="true" />
        <div className="premium-audit-card__content">
          <AuditForm variant="hero" />
        </div>
      </div>
      <div className="premium-hero-trust" aria-label="Vlastnosti diagnostiky">
        {trustItems.map((item) => (
          <span key={item} className="premium-hero-trust__item">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M12 3 5.5 5.7v5.2c0 4.3 2.7 8.1 6.5 10.1 3.8-2 6.5-5.8 6.5-10.1V5.7L12 3Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
            {item}
          </span>
        ))}
      </div>
      <p className="premium-hero-legal">
        Prevádzkovateľ: AesDC s. r. o. · IČO 55408575 · výsledok je predbežná diagnostika titulnej stránky.
      </p>
    </div>
  );
}
