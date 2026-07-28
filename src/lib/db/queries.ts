import 'server-only';
import {
  and,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  audits,
  funnelEvents,
  leads,
  opportunityBriefs,
  followUpJobs,
  reportAccessTokens,
  securityEvents,
  type AuditRecord,
  type LeadRecord,
} from '@/lib/db/schema';
import type { AuditEvidence, AuditReport, AuditStatus } from '@/lib/audit/types';

const ACTIVE_STATUSES: AuditStatus[] = [
  'created',
  'validating',
  'fetching_homepage',
  'checking_technical_files',
  'pagespeed',
  'extracting',
  'scoring',
  'assembling_report',
];

export async function createAudit(input: {
  id: string;
  publicToken: string;
  targetUrl: string;
  normalizedUrl: string;
  origin: string;
  deduplicationKey: string;
  requestFingerprint: string;
  expiresAt: Date;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrerHost?: string | null;
}): Promise<AuditRecord> {
  const now = new Date();
  const [record] = await db()
    .insert(audits)
    .values({
      ...input,
      status: 'created',
      currentStage: 'created',
      attemptCount: 0,
      createdAt: now,
    })
    .returning();

  if (!record) throw new Error('Audit record was not created.');
  return record;
}

export async function findAuditByToken(publicToken: string): Promise<AuditRecord | null> {
  const [record] = await db()
    .select()
    .from(audits)
    .where(eq(audits.publicToken, publicToken))
    .limit(1);
  return record ?? null;
}

export async function findAuditById(id: string): Promise<AuditRecord | null> {
  const [record] = await db().select().from(audits).where(eq(audits.id, id)).limit(1);
  return record ?? null;
}

export async function countRecentAuditsByFingerprint(
  fingerprint: string,
  since: Date,
): Promise<number> {
  const [result] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(audits)
    .where(and(eq(audits.requestFingerprint, fingerprint), gte(audits.createdAt, since)));
  return result?.count ?? 0;
}

export async function claimAudit(id: string, maxAttempts = 3): Promise<boolean> {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 90_000);
  const claimed = await db()
    .update(audits)
    .set({
      status: 'validating',
      currentStage: 'validating',
      startedAt: now,
      lastHeartbeatAt: now,
      processingLeaseUntil: leaseUntil,
      attemptCount: sql`${audits.attemptCount} + 1`,
      failureCode: null,
      failureMessage: null,
      failureErrorId: null,
    })
    .where(
      and(
        eq(audits.id, id),
        lt(audits.attemptCount, maxAttempts),
        or(
          eq(audits.status, 'created'),
          and(
            inArray(audits.status, ACTIVE_STATUSES),
            or(isNull(audits.processingLeaseUntil), lt(audits.processingLeaseUntil, now)),
          ),
        ),
      ),
    )
    .returning({ id: audits.id });
  return claimed.length === 1;
}

export async function resetAuditForRetry(id: string, maxAttempts = 3): Promise<boolean> {
  const [record] = await db()
    .update(audits)
    .set({
      status: 'created',
      currentStage: 'created',
      completedAt: null,
      processingLeaseUntil: null,
      failureCode: null,
      failureMessage: null,
      failureErrorId: null,
    })
    .where(and(eq(audits.id, id), eq(audits.status, 'failed'), lt(audits.attemptCount, maxAttempts)))
    .returning({ id: audits.id });
  return Boolean(record);
}

export async function updateAuditStage(id: string, stage: AuditStatus): Promise<void> {
  const now = new Date();
  await db()
    .update(audits)
    .set({
      status: stage,
      currentStage: stage,
      lastHeartbeatAt: now,
      processingLeaseUntil: new Date(now.getTime() + 90_000),
    })
    .where(eq(audits.id, id));
}

export async function completeAudit(
  id: string,
  evidence: AuditEvidence,
  report: AuditReport,
): Promise<void> {
  await db()
    .update(audits)
    .set({
      status: 'ready',
      currentStage: 'ready',
      overallScore: report.overallScore,
      confidence: report.confidence,
      reportVersion: report.version,
      evidenceJson: evidence,
      reportJson: report,
      completedAt: new Date(),
      lastHeartbeatAt: new Date(),
      processingLeaseUntil: null,
      failureCode: null,
      failureMessage: null,
      failureErrorId: null,
    })
    .where(eq(audits.id, id));
}

export async function failAudit(
  id: string,
  code: string,
  publicMessage: string,
  errorId?: string | null,
): Promise<void> {
  await db()
    .update(audits)
    .set({
      status: 'failed',
      currentStage: 'failed',
      failureCode: code,
      failureMessage: publicMessage,
      failureErrorId: errorId ?? null,
      completedAt: new Date(),
      lastHeartbeatAt: new Date(),
      processingLeaseUntil: null,
    })
    .where(eq(audits.id, id));
}

export async function upsertLead(input: {
  audit: AuditRecord;
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  primaryGoal?: string | null;
  source: 'audit_unlock' | 'manual_review';
  stage: string;
  marketingConsent: boolean;
  leadScore: number;
}): Promise<LeadRecord> {
  const now = new Date();
  const email = input.email.trim().toLowerCase();
  const [record] = await db()
    .insert(leads)
    .values({
      id: crypto.randomUUID(),
      auditId: input.audit.id,
      auditOriginSnapshot: input.audit.origin,
      auditTargetSnapshot: input.audit.targetUrl,
      email,
      name: input.name ?? null,
      company: input.company ?? null,
      phone: input.phone ?? null,
      primaryGoal: input.primaryGoal ?? null,
      source: input.source,
      stage: input.stage,
      marketingConsent: input.marketingConsent,
      consentVersion: '2026-07-v3',
      consentAt: now,
      leadScore: input.leadScore,
      vertical: input.audit.reportJson?.businessProfile.vertical ?? null,
      businessModel: input.audit.reportJson?.businessProfile.businessModel ?? null,
      utmSource: input.audit.utmSource,
      utmMedium: input.audit.utmMedium,
      utmCampaign: input.audit.utmCampaign,
      referrerHost: input.audit.referrerHost,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [leads.auditId, leads.source, leads.email],
      set: {
        name: input.name ?? null,
        company: input.company ?? null,
        phone: input.phone ?? null,
        primaryGoal: input.primaryGoal ?? null,
        stage: sql`case when ${leads.emailVerifiedAt} is not null then ${leads.stage} else ${input.stage} end`,
        marketingConsent: input.marketingConsent,
        consentVersion: '2026-07-v3',
        consentAt: now,
        leadScore: input.leadScore,
        vertical: input.audit.reportJson?.businessProfile.vertical ?? null,
        businessModel: input.audit.reportJson?.businessProfile.businessModel ?? null,
        updatedAt: now,
      },
    })
    .returning();

  if (!record) throw new Error('Lead record was not stored.');
  return record;
}

export async function findLeadForAuditEmail(
  auditId: string,
  email: string,
  source = 'audit_unlock',
): Promise<LeadRecord | null> {
  const [record] = await db()
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.auditId, auditId),
        eq(leads.email, email.trim().toLowerCase()),
        eq(leads.source, source),
      ),
    )
    .limit(1);
  return record ?? null;
}

export async function markLeadEmailDelivery(
  leadId: string,
  input: { sent: boolean; reason?: string | null },
): Promise<void> {
  await db()
    .update(leads)
    .set({
      emailLastSentAt: new Date(),
      emailDeliveryStatus: sql`case when ${leads.emailVerifiedAt} is not null then 'verified' else ${input.sent ? 'sent' : 'failed'} end`,
      emailDeliveryError: input.sent ? null : (input.reason ?? 'email_provider_failed').slice(0, 240),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId));
}

export async function claimLeadEmailDelivery(leadId: string): Promise<LeadRecord | null> {
  const now = new Date();
  const abandonedBefore = new Date(now.getTime() - 5 * 60 * 1000);
  const [record] = await db()
    .update(leads)
    .set({
      emailLastSentAt: now,
      emailDeliveryStatus: 'pending',
      emailDeliveryError: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(leads.id, leadId),
        isNull(leads.emailVerifiedAt),
        or(
          isNull(leads.emailLastSentAt),
          eq(leads.emailDeliveryStatus, 'failed'),
          and(
            eq(leads.emailDeliveryStatus, 'pending'),
            lt(leads.emailLastSentAt, abandonedBefore),
          ),
        ),
      ),
    )
    .returning();
  return record ?? null;
}

export async function claimLeadResendDelivery(
  leadId: string,
  cooldownMs = 60_000,
): Promise<LeadRecord | null> {
  const now = new Date();
  const cooldownBefore = new Date(now.getTime() - cooldownMs);
  const [record] = await db()
    .update(leads)
    .set({
      emailLastSentAt: now,
      emailDeliveryStatus: sql`case when ${leads.emailVerifiedAt} is not null then 'verified' else 'pending' end`,
      emailDeliveryError: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(leads.id, leadId),
        or(
          isNull(leads.emailLastSentAt),
          lt(leads.emailLastSentAt, cooldownBefore),
        ),
      ),
    )
    .returning();
  return record ?? null;
}

export async function markLeadVerified(
  auditId: string,
  email: string,
): Promise<LeadRecord | null> {
  const now = new Date();
  const [record] = await db()
    .update(leads)
    .set({
      emailVerifiedAt: now,
      stage: sql`case when ${leads.stage} in ('new', 'pending_email_verification') then 'verified' else ${leads.stage} end`,
      emailDeliveryStatus: 'verified',
      updatedAt: now,
    })
    .where(
      and(
        eq(leads.auditId, auditId),
        eq(leads.email, email.trim().toLowerCase()),
        eq(leads.source, 'audit_unlock'),
      ),
    )
    .returning();
  return record ?? null;
}

export async function markLeadNotificationSent(leadId: string): Promise<void> {
  await db()
    .update(leads)
    .set({ notificationSentAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, leadId));
}

export async function updateLeadWorkflow(input: {
  id: string;
  stage: string;
  notes?: string | null;
  owner?: string | null;
  nextActionAt?: Date | null;
}): Promise<LeadRecord | null> {
  const [record] = await db()
    .update(leads)
    .set({
      stage: input.stage,
      notes: input.notes ?? null,
      owner: input.owner ?? null,
      nextActionAt: input.nextActionAt ?? null,
      lastContactedAt: ['contacted', 'qualified', 'proposal', 'won', 'lost'].includes(input.stage)
        ? new Date()
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, input.id))
    .returning();
  return record ?? null;
}

export async function revokeReportAccessTokens(auditId: string, email: string): Promise<void> {
  await db()
    .update(reportAccessTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(reportAccessTokens.auditId, auditId),
        eq(reportAccessTokens.email, email.trim().toLowerCase()),
        isNull(reportAccessTokens.revokedAt),
      ),
    );
}

export async function createReportAccessToken(input: {
  auditId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  await revokeReportAccessTokens(input.auditId, email);
  await db().insert(reportAccessTokens).values({
    id: crypto.randomUUID(),
    auditId: input.auditId,
    email,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  });
}

export async function peekReportAccessToken(
  tokenHash: string,
): Promise<{ auditId: string; email: string; expiresAt: Date } | null> {
  const now = new Date();
  const [record] = await db()
    .select()
    .from(reportAccessTokens)
    .where(
      and(
        eq(reportAccessTokens.tokenHash, tokenHash),
        gt(reportAccessTokens.expiresAt, now),
        isNull(reportAccessTokens.revokedAt),
        isNull(reportAccessTokens.usedAt),
      ),
    )
    .limit(1);
  return record
    ? { auditId: record.auditId, email: record.email, expiresAt: record.expiresAt }
    : null;
}

export async function confirmReportAccessToken(
  tokenHash: string,
): Promise<{ auditId: string; email: string } | null> {
  const now = new Date();
  const [record] = await db()
    .update(reportAccessTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(reportAccessTokens.tokenHash, tokenHash),
        gt(reportAccessTokens.expiresAt, now),
        isNull(reportAccessTokens.revokedAt),
        isNull(reportAccessTokens.usedAt),
      ),
    )
    .returning({ auditId: reportAccessTokens.auditId, email: reportAccessTokens.email });
  return record ?? null;
}

export async function confirmReportAccessAndVerifyLead(
  tokenHash: string,
): Promise<{ auditId: string; email: string; leadId: string } | null> {
  const result = await db().execute<{
    auditId: string;
    email: string;
    leadId: string;
  }>(sql`
    with eligible as (
      select
        ${reportAccessTokens.id} as token_id,
        ${reportAccessTokens.auditId} as audit_id,
        ${reportAccessTokens.email} as email
      from ${reportAccessTokens}
      where ${reportAccessTokens.tokenHash} = ${tokenHash}
        and ${reportAccessTokens.expiresAt} > now()
        and ${reportAccessTokens.revokedAt} is null
        and ${reportAccessTokens.usedAt} is null
      for update
    ),
    verified as (
      update ${leads}
      set
        email_verified_at = now(),
        stage = case
          when ${leads.stage} in ('new', 'pending_email_verification') then 'verified'
          else ${leads.stage}
        end,
        email_delivery_status = 'verified',
        updated_at = now()
      from eligible
      where ${leads.auditId} = eligible.audit_id
        and ${leads.email} = eligible.email
        and ${leads.source} = 'audit_unlock'
      returning ${leads.id} as lead_id
    ),
    consumed as (
      update ${reportAccessTokens}
      set used_at = now()
      from eligible
      where ${reportAccessTokens.id} = eligible.token_id
        and exists (select 1 from verified)
      returning
        ${reportAccessTokens.auditId} as audit_id,
        ${reportAccessTokens.email} as email
    )
    select
      consumed.audit_id as "auditId",
      consumed.email as email,
      verified.lead_id as "leadId"
    from consumed
    cross join verified
  `);
  return result.rows[0] ?? null;
}

export async function recordFunnelEvent(input: {
  auditId?: string | null;
  event: string;
  sessionHash?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrerHost?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await db().insert(funnelEvents).values({
    id: crypto.randomUUID(),
    auditId: input.auditId ?? null,
    event: input.event,
    sessionHash: input.sessionHash ?? null,
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
    referrerHost: input.referrerHost ?? null,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  });
}

export async function recordSecurityEvent(input: {
  action: string;
  subjectHash: string;
  auditId?: string | null;
  success?: boolean;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await db().insert(securityEvents).values({
    id: crypto.randomUUID(),
    action: input.action,
    subjectHash: input.subjectHash,
    auditId: input.auditId ?? null,
    success: input.success ?? false,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  });
}

export async function countSecurityEvents(input: {
  action: string;
  subjectHash: string;
  since: Date;
  success?: boolean;
}): Promise<number> {
  const conditions = [
    eq(securityEvents.action, input.action),
    eq(securityEvents.subjectHash, input.subjectHash),
    gte(securityEvents.createdAt, input.since),
  ];
  if (typeof input.success === 'boolean') conditions.push(eq(securityEvents.success, input.success));
  const [result] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(securityEvents)
    .where(and(...conditions));
  return result?.count ?? 0;
}

export async function listAudits(limit = 100): Promise<AuditRecord[]> {
  return db().select().from(audits).orderBy(desc(audits.createdAt)).limit(limit);
}

export async function listLeads(limit = 100): Promise<LeadRecord[]> {
  return db().select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
}

export async function findLeadById(id: string): Promise<LeadRecord | null> {
  const [record] = await db().select().from(leads).where(eq(leads.id, id)).limit(1);
  return record ?? null;
}

export async function adminMetrics(): Promise<{
  audits: number;
  ready: number;
  failed: number;
  leads: number;
  verifiedLeads: number;
  manualReviews: number;
}> {
  const [auditCounts] = await db()
    .select({
      audits: sql<number>`count(*)::int`,
      ready: sql<number>`count(*) filter (where ${audits.status} = 'ready')::int`,
      failed: sql<number>`count(*) filter (where ${audits.status} = 'failed')::int`,
    })
    .from(audits);

  const [leadCounts] = await db()
    .select({
      leads: sql<number>`count(*)::int`,
      verifiedLeads: sql<number>`count(*) filter (where ${leads.emailVerifiedAt} is not null)::int`,
      manualReviews: sql<number>`count(*) filter (where ${leads.source} = 'manual_review')::int`,
    })
    .from(leads);

  return {
    audits: auditCounts?.audits ?? 0,
    ready: auditCounts?.ready ?? 0,
    failed: auditCounts?.failed ?? 0,
    leads: leadCounts?.leads ?? 0,
    verifiedLeads: leadCounts?.verifiedLeads ?? 0,
    manualReviews: leadCounts?.manualReviews ?? 0,
  };
}

export async function purgeExpiredData(): Promise<{
  audits: number;
  tokens: number;
  funnelEvents: number;
  securityEvents: number;
  leads: number;
  opportunityBriefs: number;
  followUpJobs: number;
}> {
  const now = new Date();
  const expiredAudits = await db()
    .select({ id: audits.id })
    .from(audits)
    .where(lt(audits.expiresAt, now));
  const ids = expiredAudits.map((item) => item.id);

  if (ids.length > 0) {
    await db()
      .update(leads)
      .set({ auditId: null, updatedAt: now })
      .where(inArray(leads.auditId, ids));
  }

  const deletedTokens = await db()
    .delete(reportAccessTokens)
    .where(or(lt(reportAccessTokens.expiresAt, now), isNotNull(reportAccessTokens.revokedAt)))
    .returning({ id: reportAccessTokens.id });
  const deletedAudits = ids.length
    ? await db().delete(audits).where(inArray(audits.id, ids)).returning({ id: audits.id })
    : [];
  const deletedFunnelEvents = await db()
    .delete(funnelEvents)
    .where(lt(funnelEvents.createdAt, new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)))
    .returning({ id: funnelEvents.id });
  const deletedLeads = await db()
    .delete(leads)
    .where(lt(leads.updatedAt, new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)))
    .returning({ id: leads.id });
  const deletedOpportunityBriefs = await db()
    .delete(opportunityBriefs)
    .where(or(lt(opportunityBriefs.expiresAt, now), isNotNull(opportunityBriefs.revokedAt)))
    .returning({ id: opportunityBriefs.id });
  const deletedFollowUpJobs = await db()
    .delete(followUpJobs)
    .where(and(lt(followUpJobs.updatedAt, new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)), inArray(followUpJobs.status, ['sent', 'failed', 'cancelled'])))
    .returning({ id: followUpJobs.id });
  const deletedSecurityEvents = await db()
    .delete(securityEvents)
    .where(lt(securityEvents.createdAt, new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)))
    .returning({ id: securityEvents.id });

  return {
    audits: deletedAudits.length,
    tokens: deletedTokens.length,
    funnelEvents: deletedFunnelEvents.length,
    securityEvents: deletedSecurityEvents.length,
    leads: deletedLeads.length,
    opportunityBriefs: deletedOpportunityBriefs.length,
    followUpJobs: deletedFollowUpJobs.length,
  };
}
