import type { BusinessProfile, ExecutiveSummary, MoneyLeak } from '@/lib/revenue/types';

export type AuditStatus =
  | 'created'
  | 'validating'
  | 'fetching_homepage'
  | 'checking_technical_files'
  | 'pagespeed'
  | 'extracting'
  | 'scoring'
  | 'assembling_report'
  | 'ready'
  | 'failed'
  | 'expired';

export type FindingStatus =
  | 'OBSERVED'
  | 'INFERRED'
  | 'NOT_DETECTED'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RuleResult = 'pass' | 'fail' | 'unknown';

export type AuditCategory =
  | 'technical'
  | 'seo'
  | 'accessibility'
  | 'trust'
  | 'conversion'
  | 'revenue';

export interface LinkSignal {
  text: string;
  href: string;
}

export interface HtmlEvidence {
  title: string | null;
  titleLength: number | null;
  metaDescription: string | null;
  metaDescriptionLength: number | null;
  canonical: string | null;
  metaRobots: string | null;
  language: string | null;
  hasViewport: boolean;
  h1Count: number;
  headings: Array<{ level: number; text: string }>;
  headingHierarchyIssues: number;
  links: LinkSignal[];
  ctaCount: number;
  emptyInteractiveCount: number;
  contactSignals: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasContactLink: boolean;
  };
  trustSignals: {
    hasPrivacyLink: boolean;
    hasAboutLink: boolean;
    hasCompanyIdentifier: boolean;
  };
  revenueSignals: {
    hasBooking: boolean;
    hasOrder: boolean;
    hasQuoteRequest: boolean;
  };
  formCount: number;
  inputCount: number;
  unlabelledInputs: number;
  imageCount: number;
  imagesWithoutAlt: number;
  schemaTypes: string[];
  scriptCount: number;
  bodyTextLength: number;
  likelyJavascriptShell: boolean;
}

export interface TechnicalFileEvidence {
  robots: {
    checked: boolean;
    available: boolean;
    status: number | null;
    containsSitemap: boolean | null;
    blocksAll: boolean | null;
    discoveredSitemaps: string[];
  };
  sitemap: {
    checked: boolean;
    available: boolean;
    status: number | null;
    kind: 'urlset' | 'sitemapindex' | null;
    url: string | null;
  };
}

export interface PageSpeedEvidence {
  available: boolean;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  fetchedAt: string | null;
  reason: string | null;
}

export interface AuditEvidence {
  sourceUrl: string;
  finalUrl: string;
  httpStatus: number;
  contentType: string;
  bodyBytes: number;
  durationMs: number;
  responseHeaders: Record<string, string | null>;
  fetchedAt: string;
  html: HtmlEvidence;
  technicalFiles: TechnicalFileEvidence;
  pageSpeed: PageSpeedEvidence;
}

export interface AuditRuleResult {
  id: string;
  category: AuditCategory;
  weight: number;
  applicable: boolean;
  measured: boolean;
  result: RuleResult;
  status: FindingStatus;
}

export interface AuditFinding {
  id: string;
  category: AuditCategory;
  title: string;
  status: FindingStatus;
  severity: FindingSeverity;
  confidence: number;
  evidence: string;
  impact: string;
  recommendation: string;
  sourceUrl: string;
  scoreDelta: number;
}

export interface AuditStrength {
  id: string;
  category: AuditCategory;
  title: string;
  evidence: string;
}

export interface AuditOpportunity {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface AuditReport {
  version: 'next-mvp-v4';
  generatedAt: string;
  targetUrl: string;
  overallScore: number | null;
  overallCoverage: number;
  confidence: number;
  categoryScores: Record<AuditCategory, number | null>;
  categoryCoverage: Record<AuditCategory, number>;
  findings: AuditFinding[];
  strengths: AuditStrength[];
  opportunities: AuditOpportunity[];
  businessProfile: BusinessProfile;
  executiveSummary: ExecutiveSummary;
  moneyLeaks: MoneyLeak[];
  limitations: string[];
  analyzedScope: string[];
  evidenceSummary: {
    pagesAnalyzed: number;
    externalMetricsAvailable: boolean;
    evidenceItems: number;
    likelyJavascriptShell: boolean;
    rulesApplicable: number;
    rulesMeasured: number;
  };
}

export interface AuditStatusPayload {
  status: AuditStatus;
  currentStage: AuditStatus;
  stageLabel: string;
  ready: boolean;
  failed: boolean;
  stale: boolean;
  retryable: boolean;
  attemptCount: number;
  maxAttempts: number;
  lastHeartbeatAt: string | null;
  retryAfterMs: number;
  message: string | null;
  errorId: string | null;
  resultUrl: string | null;
}
