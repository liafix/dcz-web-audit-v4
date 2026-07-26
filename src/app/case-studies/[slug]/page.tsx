import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CASE_STUDIES } from '@/content/case-studies';
import { PublicShell } from '@/components/layout/public-shell';
import { Card, CardContent } from '@/components/ui/card';
import { recordFunnelEventSafe } from '@/lib/analytics/funnel';
import { findAuditByToken } from '@/lib/db/queries';
import { hasReportAccess } from '@/lib/auth/report-access';
import { findVerifiedLeadForAudit } from '@/lib/db/revenue-queries';
import { recalculateAndRouteLead } from '@/lib/leads/routing';
import type { ProofType } from '@/lib/revenue/types';
import { buildPublicMetadata, CASE_STUDY_SEO } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seo = CASE_STUDY_SEO[slug];
  if (!seo) return { robots: { index: false, follow: false, nocache: true } };
  return buildPublicMetadata(seo);
}

const proofLabel: Record<ProofType, string> = {
  verified_client_result: 'Overený klientsky výsledok',
  delivered_project: 'Dodané technické riešenie',
  demo: 'Demo',
  concept: 'Transparentne označený koncept',
};

export default async function CaseStudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((item) => item.slug === slug);
  if (!study) notFound();

  const query = await searchParams;
  const token = typeof query.audit === 'string' ? query.audit : null;
  if (token) {
    const audit = await findAuditByToken(token);
    if (audit && await hasReportAccess(audit.id)) {
      await recordFunnelEventSafe({
        auditId: audit.id,
        event: 'case_study_opened',
        metadata: { caseStudyId: study.id, proofType: study.proofType },
      });
      const lead = await findVerifiedLeadForAudit(audit.id);
      if (lead) await recalculateAndRouteLead(lead.id);
    }
  }

  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-24">
        <span className="sample-badge observed">{proofLabel[study.proofType]}</span>
        <h1 className="mt-5 text-4xl font-semibold text-white md:text-6xl">{study.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">{study.summary}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent>
              <p className="eyebrow">Výzva</p>
              <p className="mt-4 leading-7 text-slate-400">{study.challenge}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="eyebrow">Navrhnuté / dodané</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {study.implemented.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
        {study.verifiedResults?.length ? (
          <Card className="mt-5">
            <CardContent>
              <p className="eyebrow text-emerald-200">Overené výsledky</p>
              <ul className="mt-4 space-y-3">
                {study.verifiedResults.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        {study.disclaimer ? (
          <p className="mt-6 rounded-xl border border-amber-300/12 bg-amber-300/[.04] p-4 text-sm leading-6 text-amber-100/80">
            {study.disclaimer}
          </p>
        ) : null}
      </article>
    </PublicShell>
  );
}
