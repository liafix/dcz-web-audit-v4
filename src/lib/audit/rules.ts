import type {
  AuditCategory,
  AuditEvidence,
  AuditFinding,
  AuditOpportunity,
  AuditRuleResult,
  AuditStrength,
  FindingSeverity,
  FindingStatus,
  RuleResult,
} from '@/lib/audit/types';

interface RuleEvaluation {
  rules: AuditRuleResult[];
  findings: AuditFinding[];
  strengths: AuditStrength[];
  opportunities: AuditOpportunity[];
}

interface RuleInput {
  id: string;
  category: AuditCategory;
  weight: number;
  applicable?: boolean;
  measured?: boolean;
  passed?: boolean;
  statusOnFailure?: FindingStatus;
  severity?: FindingSeverity;
  title: string;
  evidence: string;
  impact: string;
  recommendation: string;
  sourceUrl: string;
  strengthTitle?: string;
  strengthEvidence?: string;
  confidence?: number;
}

function severityDelta(severity: FindingSeverity): number {
  return { critical: -18, high: -12, medium: -7, low: -3, info: 0 }[severity];
}

function canonicalIsValid(value: string | null, finalUrl: string): boolean {
  if (!value) return false;
  try {
    const canonical = new URL(value, finalUrl);
    return ['http:', 'https:'].includes(canonical.protocol) && canonical.hostname.length > 0;
  } catch {
    return false;
  }
}

function robotsAllowsIndexing(metaRobots: string | null): boolean {
  if (!metaRobots) return true;
  return !/(^|[\s,])(noindex|none)([\s,]|$)/i.test(metaRobots);
}

export function evaluateRules(evidence: AuditEvidence): RuleEvaluation {
  const { html, technicalFiles, pageSpeed, sourceUrl, finalUrl } = evidence;
  const rules: AuditRuleResult[] = [];
  const findings: AuditFinding[] = [];
  const strengths: AuditStrength[] = [];
  const opportunities: AuditOpportunity[] = [];
  const bodyMeasured = !html.likelyJavascriptShell;

  function add(input: RuleInput): void {
    const applicable = input.applicable ?? true;
    const measured = applicable && (input.measured ?? true);
    const result: RuleResult = !applicable || !measured
      ? 'unknown'
      : input.passed
        ? 'pass'
        : 'fail';
    const status: FindingStatus = !applicable
      ? 'NOT_APPLICABLE'
      : !measured
        ? 'UNKNOWN'
        : result === 'pass'
          ? 'OBSERVED'
          : (input.statusOnFailure ?? 'OBSERVED');

    rules.push({
      id: input.id,
      category: input.category,
      weight: input.weight,
      applicable,
      measured,
      result,
      status,
    });

    if (result === 'pass' && input.strengthTitle) {
      strengths.push({
        id: `${input.id}-pass`,
        category: input.category,
        title: input.strengthTitle,
        evidence: input.strengthEvidence ?? input.evidence,
      });
    }

    if (result === 'fail') {
      const severity = input.severity ?? 'medium';
      findings.push({
        id: input.id,
        category: input.category,
        title: input.title,
        status,
        severity,
        confidence: input.confidence ?? (status === 'INFERRED' ? 76 : 93),
        evidence: input.evidence,
        impact: input.impact,
        recommendation: input.recommendation,
        sourceUrl: input.sourceUrl,
        scoreDelta: severityDelta(severity),
      });
    }
  }

  if (html.likelyJavascriptShell) {
    findings.push({
      id: 'javascript-shell-coverage',
      category: 'technical',
      title: 'Statické HTML obsahuje málo viditeľných signálov',
      status: 'UNKNOWN',
      severity: 'info',
      confidence: 88,
      evidence: `Načítaný zdroj obsahoval ${html.scriptCount} skriptov a iba ${html.bodyTextLength} znakov textu.`,
      impact: 'Časť obsahu môže vzniknúť až v prehliadači, preto je pokrytie diagnostiky nižšie.',
      recommendation: 'Dôležité nadpisy, CTA a metadata sprístupnite už v serverovo vyrenderovanom HTML.',
      sourceUrl,
      scoreDelta: 0,
    });
  }

  add({
    id: 'https', category: 'technical', weight: 12, passed: new URL(finalUrl).protocol === 'https:',
    statusOnFailure: 'OBSERVED', severity: 'critical', title: 'Stránka nie je dostupná cez HTTPS',
    evidence: `Finálna analyzovaná URL: ${finalUrl}.`, impact: 'Nešifrované spojenie znižuje dôveru a bezpečnosť návštevníkov.',
    recommendation: 'Zapnite TLS, presmerujte HTTP na HTTPS a používajte jeden canonical host.', sourceUrl,
    strengthTitle: 'Stránka používa HTTPS',
  });
  add({
    id: 'http-status', category: 'technical', weight: 8, passed: evidence.httpStatus >= 200 && evidence.httpStatus < 300,
    severity: 'critical', title: 'Titulná stránka nevrátila úspešný HTTP stav', evidence: `HTTP stav: ${evidence.httpStatus}.`,
    impact: 'Vyhľadávače a návštevníci nemusia stránku spoľahlivo načítať.', recommendation: 'Opravte serverovú odpoveď a overte monitoring dostupnosti.', sourceUrl,
    strengthTitle: 'Titulná stránka vracia úspešný HTTP stav',
  });
  add({
    id: 'response-time', category: 'technical', weight: 6, passed: evidence.durationMs <= 3_000,
    statusOnFailure: 'OBSERVED', severity: evidence.durationMs > 6_000 ? 'high' : 'medium', title: 'Serverová odpoveď je pomalá',
    evidence: `Bezpečné načítanie dokumentu trvalo približne ${evidence.durationMs} ms.`, impact: 'Pomalá odpoveď odďaľuje zobrazenie obsahu a môže zvyšovať odchody.',
    recommendation: 'Overte TTFB, cache, hosting, databázové dotazy a veľkosť serverovej odpovede.', sourceUrl,
    strengthTitle: 'Server odpovedá v primeranom čase',
  });
  add({
    id: 'html-size', category: 'technical', weight: 4, passed: evidence.bodyBytes <= 750_000,
    severity: 'low', title: 'HTML dokument je nadmerne veľký', evidence: `Načítané HTML: ${Math.round(evidence.bodyBytes / 1024)} kB.`,
    impact: 'Veľký dokument zvyšuje prenos a čas parsovania.', recommendation: 'Odstráňte nepotrebný inline obsah a obmedzte serverom generovaný markup.', sourceUrl,
    strengthTitle: 'HTML dokument má primeranú veľkosť',
  });
  const securityHeaderCount = ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy']
    .filter((key) => Boolean(evidence.responseHeaders[key])).length;
  add({
    id: 'security-headers', category: 'technical', weight: 7, passed: securityHeaderCount >= 2,
    severity: 'low', title: 'Základné bezpečnostné hlavičky sú neúplné', evidence: `Zistené ${securityHeaderCount} zo 4 kontrolovaných hlavičiek.`,
    impact: 'Prehliadač má menej ochranných pravidiel proti bežným webovým rizikám.', recommendation: 'Doplňte HSTS, CSP, X-Content-Type-Options a Referrer-Policy podľa aplikácie.', sourceUrl,
    strengthTitle: 'Web používa viacero bezpečnostných hlavičiek',
  });
  add({
    id: 'compression', category: 'technical', weight: 3, applicable: evidence.bodyBytes > 100_000,
    passed: Boolean(evidence.responseHeaders['content-encoding']), severity: 'low', title: 'Kompresia odpovede nebola potvrdená',
    evidence: `Content-Encoding: ${evidence.responseHeaders['content-encoding'] ?? 'nezistené'}.`, impact: 'Nekomprimovaný text môže zvyšovať množstvo prenesených dát.',
    recommendation: 'Zapnite Brotli alebo gzip pre textové odpovede.', sourceUrl, strengthTitle: 'Textová odpoveď používa kompresiu',
  });
  add({
    id: 'viewport', category: 'technical', weight: 8, passed: html.hasViewport, statusOnFailure: 'NOT_DETECTED', severity: 'critical',
    title: 'Mobilný viewport nebol zistený', evidence: 'V HTML sa nenašiel meta viewport.', impact: 'Mobilné zobrazenie môže byť nečitateľné alebo zle škálované.',
    recommendation: 'Doplňte responsive viewport a overte formuláre na mobile.', sourceUrl, strengthTitle: 'Mobilný viewport je prítomný',
  });
  add({
    id: 'robots-txt', category: 'technical', weight: 6, passed: technicalFiles.robots.available,
    statusOnFailure: 'NOT_DETECTED', severity: 'low', title: 'robots.txt nebol potvrdený', evidence: 'Na /robots.txt sa nepodarilo potvrdiť platný textový súbor.',
    impact: 'Crawlerom môže chýbať centrálna informácia o prehľadávaní.', recommendation: 'Zverejnite jednoduchý robots.txt a uveďte v ňom sitemap.', sourceUrl,
    strengthTitle: 'robots.txt je dostupný',
  });
  add({
    id: 'robots-indexing', category: 'technical', weight: 12, applicable: technicalFiles.robots.available,
    passed: technicalFiles.robots.blocksAll !== true, severity: 'critical', title: 'robots.txt blokuje celý web',
    evidence: 'Vo wildcard skupine bol zistený Disallow: /.', impact: 'Organické prehľadávanie môže byť úplne zastavené.',
    recommendation: 'Overte, či nejde o staging pravidlo omylom nasadené v produkcii.', sourceUrl,
    strengthTitle: 'robots.txt neblokuje celý web',
  });
  add({
    id: 'sitemap', category: 'technical', weight: 6, passed: technicalFiles.sitemap.available,
    statusOnFailure: 'NOT_DETECTED', severity: 'low', title: 'Sitemap nebola potvrdená', evidence: 'V robots.txt ani na /sitemap.xml sa nenašiel urlset alebo sitemapindex.',
    impact: 'Hlbšie stránky sa môžu vyhľadávačom objavovať pomalšie.', recommendation: 'Vygenerujte sitemap.xml a pripojte ju v robots.txt a Search Console.', sourceUrl,
    strengthTitle: 'Sitemap je dostupná', strengthEvidence: technicalFiles.sitemap.url ?? 'Sitemap bola potvrdená.',
  });
  add({
    id: 'pagespeed-performance', category: 'technical', weight: 12, measured: pageSpeed.available && pageSpeed.performance !== null,
    passed: (pageSpeed.performance ?? 0) >= 60, severity: (pageSpeed.performance ?? 100) < 40 ? 'high' : 'medium', title: 'Mobilný PageSpeed výkon je slabý',
    evidence: pageSpeed.performance === null ? 'PageSpeed výkon nebol dostupný.' : `PageSpeed performance: ${pageSpeed.performance}/100.`,
    impact: 'Pomalé načítanie môže zvyšovať odchody a znižovať počet konverzií.', recommendation: 'Prioritizujte LCP, JavaScript, obrázky a cache podľa Lighthouse dôkazov.', sourceUrl,
    strengthTitle: 'Mobilný výkon dosahuje použiteľný základ',
  });

  add({
    id: 'title', category: 'seo', weight: 10, passed: Boolean(html.title), statusOnFailure: 'NOT_DETECTED', severity: 'high',
    title: 'SEO titulok nebol nájdený', evidence: 'V HTML sa nenašiel element <title>.', impact: 'Vyhľadávače aj návštevníci dostávajú slabší signál o obsahu stránky.',
    recommendation: 'Doplňte unikátny titulok s hlavnou službou a lokalitou.', sourceUrl, strengthTitle: 'SEO titulok je prítomný',
  });
  add({
    id: 'title-length', category: 'seo', weight: 5, applicable: Boolean(html.title), passed: (html.titleLength ?? 0) >= 25 && (html.titleLength ?? 0) <= 65,
    severity: 'low', title: 'SEO titulok má neoptimálnu dĺžku', evidence: `Titulok má ${html.titleLength ?? 0} znakov.`, impact: 'Titulok sa môže skrátiť alebo pôsobiť neurčito.',
    recommendation: 'Mierte približne na 30 až 60 zmysluplných znakov.', sourceUrl, strengthTitle: 'SEO titulok má primeranú dĺžku',
  });
  add({
    id: 'meta-description', category: 'seo', weight: 8, passed: Boolean(html.metaDescription), statusOnFailure: 'NOT_DETECTED', severity: 'medium',
    title: 'Meta description nebola zistená', evidence: 'V HTML sa nenašiel meta description.', impact: 'Výsledok vo vyhľadávaní nemusí mať presvedčivý popis.',
    recommendation: 'Doplňte konkrétny popis hodnoty, služby a CTA.', sourceUrl, strengthTitle: 'Meta description je prítomná',
  });
  add({
    id: 'meta-description-length', category: 'seo', weight: 4, applicable: Boolean(html.metaDescription),
    passed: (html.metaDescriptionLength ?? 0) >= 70 && (html.metaDescriptionLength ?? 0) <= 170, severity: 'low',
    title: 'Meta description má neoptimálnu dĺžku', evidence: `Popis má ${html.metaDescriptionLength ?? 0} znakov.`, impact: 'Popis môže byť príliš neurčitý alebo skrátený.',
    recommendation: 'Použite stručný, konkrétny popis približne 90 až 160 znakov.', sourceUrl, strengthTitle: 'Meta description má primeranú dĺžku',
  });
  add({
    id: 'h1', category: 'seo', weight: 9, measured: bodyMeasured, passed: html.h1Count === 1,
    statusOnFailure: html.h1Count === 0 ? 'NOT_DETECTED' : 'OBSERVED', severity: html.h1Count === 0 ? 'high' : 'low',
    title: html.h1Count === 0 ? 'Hlavný nadpis H1 nebol zistený' : 'Stránka používa viac hlavných nadpisov', evidence: `Nájdených H1: ${html.h1Count}.`,
    impact: 'Používateľ aj vyhľadávač môžu ťažšie rozpoznať hlavnú ponuku.', recommendation: 'Použite jeden konkrétny H1 a logickú hierarchiu H2/H3.', sourceUrl,
    strengthTitle: 'Stránka používa jednoznačný H1',
  });
  add({
    id: 'heading-hierarchy', category: 'seo', weight: 5, measured: bodyMeasured, passed: html.headingHierarchyIssues === 0,
    severity: 'low', title: 'Hierarchia nadpisov preskakuje úrovne', evidence: `Zistené preskočenia úrovní: ${html.headingHierarchyIssues}.`, impact: 'Štruktúra obsahu môže byť menej zrozumiteľná pre vyhľadávače aj asistívne technológie.',
    recommendation: 'Používajte nadpisy v logickom poradí bez preskakovania úrovní.', sourceUrl, strengthTitle: 'Hierarchia nadpisov je logická',
  });
  add({
    id: 'canonical', category: 'seo', weight: 7, passed: canonicalIsValid(html.canonical, finalUrl), statusOnFailure: 'NOT_DETECTED', severity: 'low',
    title: 'Platná canonical URL nebola potvrdená', evidence: html.canonical ?? 'Canonical nebol nájdený.', impact: 'Duplicitné URL môžu vysielať nejednoznačné indexačné signály.',
    recommendation: 'Doplňte platný self-canonical na preferovanú HTTPS URL.', sourceUrl, strengthTitle: 'Canonical je platne nastavený',
  });
  add({
    id: 'meta-robots-indexing', category: 'seo', weight: 14, passed: robotsAllowsIndexing(html.metaRobots), severity: 'critical',
    title: 'Meta robots zakazuje indexovanie titulnej stránky', evidence: `Meta robots: ${html.metaRobots ?? 'nezadané — indexovanie je štandardne povolené'}.`, impact: 'Titulná stránka môže byť odstránená alebo chýbať vo výsledkoch vyhľadávania.',
    recommendation: 'Odstráňte noindex z produkčnej titulnej stránky, pokiaľ nejde o zámer.', sourceUrl, strengthTitle: 'Meta robots neblokuje indexovanie',
  });
  add({
    id: 'structured-data', category: 'seo', weight: 5, measured: bodyMeasured, passed: html.schemaTypes.length > 0,
    statusOnFailure: 'NOT_DETECTED', severity: 'low', title: 'Štruktúrované dáta neboli zistené', evidence: 'V HTML sa nenašiel čitateľný JSON-LD typ.', impact: 'Vyhľadávače majú menej strojovo čitateľného kontextu.',
    recommendation: 'Doplňte pravdivé Organization/LocalBusiness/WebSite schema podľa obsahu.', sourceUrl, strengthTitle: 'Štruktúrované dáta sú prítomné',
    strengthEvidence: html.schemaTypes.join(', '),
  });
  add({
    id: 'pagespeed-seo', category: 'seo', weight: 8, measured: pageSpeed.available && pageSpeed.seo !== null, passed: (pageSpeed.seo ?? 0) >= 80,
    severity: 'medium', title: 'PageSpeed SEO kategória odhalila nedostatky', evidence: pageSpeed.seo === null ? 'PageSpeed SEO nebol dostupný.' : `PageSpeed SEO: ${pageSpeed.seo}/100.`,
    impact: 'Technické SEO kontroly môžu obmedzovať objaviteľnosť a kvalitu výsledku.', recommendation: 'Opravte konkrétne Lighthouse SEO audity a znovu ich overte.', sourceUrl,
    strengthTitle: 'PageSpeed SEO dosahuje dobrý základ',
  });

  add({
    id: 'language', category: 'accessibility', weight: 8, passed: Boolean(html.language), statusOnFailure: 'NOT_DETECTED', severity: 'low',
    title: 'Jazyk dokumentu nebol deklarovaný', evidence: 'Element <html> nemá zistený atribút lang.', impact: 'Čítačky obrazovky môžu obsah interpretovať nesprávnou výslovnosťou.',
    recommendation: 'Nastavte správny jazyk dokumentu.', sourceUrl, strengthTitle: 'Jazyk dokumentu je deklarovaný',
  });
  add({
    id: 'image-alt', category: 'accessibility', weight: 8, applicable: html.imageCount > 0, measured: bodyMeasured,
    passed: html.imagesWithoutAlt / Math.max(1, html.imageCount) <= 0.25, severity: 'medium', title: 'Viaceré obrázky nemajú atribút alt',
    evidence: `${html.imagesWithoutAlt} z ${html.imageCount} obrázkov nemá atribút alt.`, impact: 'Obsah môže byť nedostupný a obrázkové SEO slabšie.',
    recommendation: 'Doplňte vecné alt texty k obsahovým obrázkom a prázdny alt k dekoráciám.', sourceUrl, strengthTitle: 'Väčšina obrázkov má alt atribút',
  });
  add({
    id: 'form-labels', category: 'accessibility', weight: 10, applicable: html.inputCount > 0, measured: bodyMeasured, passed: html.unlabelledInputs === 0,
    severity: 'medium', title: 'Niektoré formulárové polia nemajú label', evidence: `${html.unlabelledInputs} z ${html.inputCount} polí nemá zistený label alebo aria-label.`,
    impact: 'Formulár je ťažší pre používateľov čítačiek obrazovky a môže znižovať dokončenie.', recommendation: 'Prepojte každé pole s viditeľným labelom a chybovým stavom.', sourceUrl,
    strengthTitle: 'Formulárové polia majú základné označenie',
  });
  add({
    id: 'empty-interactive', category: 'accessibility', weight: 7, measured: bodyMeasured, passed: html.emptyInteractiveCount === 0,
    severity: 'medium', title: 'Niektoré odkazy alebo tlačidlá nemajú dostupný názov', evidence: `Prázdne interaktívne prvky: ${html.emptyInteractiveCount}.`,
    impact: 'Používateľ čítačky obrazovky nemusí rozumieť účelu ovládacieho prvku.', recommendation: 'Doplňte viditeľný text alebo presný aria-label.', sourceUrl,
    strengthTitle: 'Interaktívne prvky majú dostupný názov',
  });
  add({
    id: 'pagespeed-accessibility', category: 'accessibility', weight: 12, measured: pageSpeed.available && pageSpeed.accessibility !== null,
    passed: (pageSpeed.accessibility ?? 0) >= 80, severity: 'medium', title: 'PageSpeed accessibility kategória odhalila nedostatky',
    evidence: pageSpeed.accessibility === null ? 'PageSpeed accessibility nebol dostupný.' : `PageSpeed accessibility: ${pageSpeed.accessibility}/100.`,
    impact: 'Časť používateľov môže mať problém web ovládať alebo pochopiť.', recommendation: 'Opravte konkrétne Lighthouse accessibility audity a vykonajte manuálny keyboard test.', sourceUrl,
    strengthTitle: 'PageSpeed accessibility dosahuje dobrý základ',
  });

  const hasContact = html.contactSignals.hasPhone || html.contactSignals.hasEmail || html.contactSignals.hasContactLink;
  add({
    id: 'contact-path', category: 'trust', weight: 10, measured: bodyMeasured, passed: hasContact, statusOnFailure: 'NOT_DETECTED', severity: 'high',
    title: 'Kontaktná cesta nebola zistená', evidence: 'V statickom HTML nebolo zistené tel:, mailto: ani jednoznačný kontaktný odkaz.', impact: 'Záujemca môže odísť bez možnosti rýchlo nadviazať kontakt.',
    recommendation: 'Zobrazte primárny kontakt a krátky formulár na viditeľnom mieste.', sourceUrl, strengthTitle: 'Kontaktná cesta je viditeľná',
  });
  add({
    id: 'privacy-link', category: 'trust', weight: 8, measured: bodyMeasured, passed: html.trustSignals.hasPrivacyLink, statusOnFailure: 'NOT_DETECTED', severity: html.formCount > 0 ? 'medium' : 'low',
    title: 'Cesta k ochrane súkromia nebola zistená', evidence: 'V analyzovaných odkazoch sa nenašla privacy/GDPR stránka.', impact: 'Pri formulároch môže chýbať dôležitý právny a dôveryhodnostný signál.',
    recommendation: 'Pridajte dostupný odkaz na zásady ochrany osobných údajov.', sourceUrl, strengthTitle: 'Ochrana súkromia je dohľadateľná',
  });
  add({
    id: 'about-link', category: 'trust', weight: 5, measured: bodyMeasured, passed: html.trustSignals.hasAboutLink, statusOnFailure: 'NOT_DETECTED', severity: 'low',
    title: 'Predstavenie firmy nebolo zistené', evidence: 'V analyzovaných odkazoch sa nenašla stránka O nás/About.', impact: 'Návštevník môže mať menej podkladov na posúdenie dôveryhodnosti.',
    recommendation: 'Doplňte stručné predstavenie tímu, skúseností a spôsobu spolupráce.', sourceUrl, strengthTitle: 'Predstavenie firmy je dohľadateľné',
  });
  add({
    id: 'company-identity', category: 'trust', weight: 10, measured: bodyMeasured, passed: html.trustSignals.hasCompanyIdentifier, statusOnFailure: 'NOT_DETECTED', severity: 'medium',
    title: 'Identita prevádzkovateľa nebola zistená', evidence: 'V textovom obsahu nebol zistený IČO ani bežné označenie právnej formy.', impact: 'Chýbajúca identita môže zvyšovať neistotu pred dopytom alebo platbou.',
    recommendation: 'Uveďte plné obchodné meno, IČO, sídlo a kontakt vo footeri alebo právnych stránkach.', sourceUrl, strengthTitle: 'Identita prevádzkovateľa je uvedená',
    confidence: 82,
  });

  add({
    id: 'primary-cta', category: 'conversion', weight: 12, measured: bodyMeasured, passed: html.ctaCount > 0, statusOnFailure: 'NOT_DETECTED', severity: 'high',
    title: 'Jasná výzva k akcii nebola zistená', evidence: 'V odkazoch sa nenašiel zrozumiteľný objednávkový, kontaktný alebo konzultačný CTA signál.', impact: 'Návštevník nemusí vedieť, aký ďalší krok má urobiť.',
    recommendation: 'Pridajte jeden dominantný CTA podľa hlavného obchodného cieľa.', sourceUrl, strengthTitle: 'Stránka obsahuje akčný prvok', strengthEvidence: `Zistené CTA: ${html.ctaCount}.`,
  });
  add({
    id: 'cta-repetition', category: 'conversion', weight: 5, applicable: html.ctaCount > 0, measured: bodyMeasured, passed: html.ctaCount >= 2,
    statusOnFailure: 'OBSERVED', severity: 'low', title: 'Hlavný CTA sa nemusí opakovať v dlhšom obsahu', evidence: `Zistené CTA odkazy: ${html.ctaCount}.`, impact: 'Používateľ môže po prečítaní stránky stratiť jednoduchú cestu k ďalšiemu kroku.',
    recommendation: 'Zopakujte konzistentný CTA po hlavných hodnotových blokoch bez agresívneho nátlaku.', sourceUrl, strengthTitle: 'CTA sa objavuje na viacerých miestach',
  });
  add({
    id: 'conversion-contact', category: 'conversion', weight: 10, measured: bodyMeasured, passed: hasContact, statusOnFailure: 'NOT_DETECTED', severity: 'high',
    title: 'Rýchly kontakt nebol zistený', evidence: 'Titulná stránka nemá zistený telefón, e-mail ani kontaktnú cestu.', impact: 'Záujemca môže odísť bez konverzie.',
    recommendation: 'Sprístupnite kontakt alebo formulár pri hlavnej ponuke.', sourceUrl, strengthTitle: 'Rýchly kontakt je dostupný',
  });
  add({
    id: 'lead-form', category: 'conversion', weight: 6, measured: bodyMeasured, passed: html.formCount > 0,
    statusOnFailure: 'NOT_DETECTED', severity: 'low', title: 'Formulár na titulnej stránke nebol zistený', evidence: `Zistené formuláre: ${html.formCount}.`, impact: 'Používateľ môže byť odkázaný iba na ďalšiu stránku alebo externý kontakt.',
    recommendation: 'Zvážte krátky formulár tam, kde znižuje trenie a zodpovedá obchodnému procesu.', sourceUrl, strengthTitle: 'Titulná stránka obsahuje formulár',
  });

  const hasRevenuePath = html.revenueSignals.hasBooking || html.revenueSignals.hasOrder || html.revenueSignals.hasQuoteRequest;
  add({
    id: 'revenue-path', category: 'revenue', weight: 14, measured: bodyMeasured, passed: hasRevenuePath, statusOnFailure: 'NOT_DETECTED', severity: 'medium',
    title: 'Priama príjmová alebo kvalifikačná cesta nebola zistená', evidence: 'V statickom HTML nebol zistený booking, objednávka ani žiadosť o ponuku.',
    impact: 'Web môže fungovať skôr ako prezentácia než aktívny predajný kanál; dynamické prvky však môžu zostať mimo rozsahu.', recommendation: 'Zvážte transakčný alebo kvalifikačný krok vhodný pre váš typ podnikania.', sourceUrl,
    strengthTitle: 'Bol zistený priamy obchodný krok', confidence: html.likelyJavascriptShell ? 55 : 78,
  });
  add({
    id: 'contact-fallback', category: 'revenue', weight: 6, applicable: !hasRevenuePath, measured: bodyMeasured, passed: hasContact,
    statusOnFailure: 'NOT_DETECTED', severity: 'high', title: 'Nie je zistená ani priama príjmová cesta, ani kontaktný fallback', evidence: 'Web nemá zistenú rezerváciu, objednávku, ponuku ani jasný kontakt.',
    impact: 'Návštevník nemá zjavný spôsob, ako sa stať leadom alebo zákazníkom.', recommendation: 'Pridajte minimálne jasný kontakt alebo krátky dopytový formulár.', sourceUrl,
    strengthTitle: 'Kontaktná cesta nahrádza chýbajúcu transakciu',
  });

  add({
    id: 'pagespeed-best-practices', category: 'technical', weight: 7, measured: pageSpeed.available && pageSpeed.bestPractices !== null,
    passed: (pageSpeed.bestPractices ?? 0) >= 80, severity: 'medium', title: 'PageSpeed best-practices kategória odhalila nedostatky',
    evidence: pageSpeed.bestPractices === null ? 'PageSpeed best practices nebol dostupný.' : `PageSpeed best practices: ${pageSpeed.bestPractices}/100.`,
    impact: 'Technické nedostatky môžu znižovať stabilitu, bezpečnosť alebo kvalitu používateľskej skúsenosti.', recommendation: 'Opravte konkrétne Lighthouse best-practices audity.', sourceUrl,
    strengthTitle: 'PageSpeed best practices dosahuje dobrý základ',
  });

  if (!hasRevenuePath) {
    opportunities.push({
      id: 'revenue-consultation',
      title: 'Navrhnúť príjmový funnel na mieru',
      description: 'DCZ môže spojiť CTA, formulár, rezerváciu alebo platbu s merateľným obchodným cieľom.',
      ctaLabel: 'Objednať 20-min konzultáciu',
      ctaUrl: 'https://dcz.sk/kontakt?utm_source=dczwebaudit&utm_medium=result&utm_campaign=next_mvp_v3',
    });
  }
  if (!html.trustSignals.hasAboutLink || !html.trustSignals.hasCompanyIdentifier) {
    opportunities.push({
      id: 'trust-upgrade',
      title: 'Posilniť dôveru pred konverziou',
      description: 'Jasný prevádzkovateľ, referencia, proces a kontaktná osoba môžu znížiť neistotu návštevníka.',
      ctaLabel: 'Pozrieť riešenia DCZ',
      ctaUrl: 'https://dcz.sk/?utm_source=dczwebaudit&utm_medium=result&utm_campaign=trust_v3',
    });
  }

  return { rules, findings, strengths, opportunities };
}
