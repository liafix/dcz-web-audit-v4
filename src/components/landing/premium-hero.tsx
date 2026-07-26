import { HeroAuditCard } from '@/components/landing/hero-audit-card';
import { HeroStage } from '@/components/landing/hero-stage';

export function PremiumHero() {
  return (
    <HeroStage>
      <section className="premium-hero" aria-labelledby="premium-hero-title">
        <div className="premium-hero__intro">
          <div className="premium-hero__badge premium-hero-enter premium-hero-enter--badge">
            <span aria-hidden="true" />
            DCZ Revenue Diagnostic · evidence pred tvrdeniami
          </div>
          <h1 id="premium-hero-title" className="premium-hero__title premium-hero-enter premium-hero-enter--title">
            Zistite, kde váš web
            <span>môže strácať peniaze.</span>
          </h1>
          <p className="premium-hero__copy premium-hero-enter premium-hero-enter--copy">
            Preveríme verejné signály titulnej stránky, odhalíme najväčšie obchodné bariéry a ukážeme vám, čo má zmysel opraviť ako prvé.
          </p>
        </div>
        <HeroAuditCard />
      </section>
    </HeroStage>
  );
}
