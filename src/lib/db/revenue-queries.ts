import 'server-only';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  auditBusinessProfiles,
  bookingIntents,
  followUpJobs,
  funnelEvents,
  leadQualifications,
  leads,
  opportunityBriefs,
  roiScenarios,
  type BookingIntentRecord,
  type FollowUpJobRecord,
  type LeadQualificationRecord,
  type LeadRecord,
  type OpportunityBriefRecord,
  type RoiScenarioRecord,
} from '@/lib/db/schema';
import { calculateHighEndLeadScore } from '@/lib/leads/scoring';
import type {
  BusinessProfile,
  DecisionRole,
  ProjectTimeline,
  OpportunityBriefData,
  QualificationInput,
  RoiInputs,
  RoiScenarioResult,
} from '@/lib/revenue/types';

export async function upsertBusinessProfile(auditId: string, profile: BusinessProfile): Promise<void> {
  const now = new Date();
  await db().insert(auditBusinessProfiles).values({
    id: crypto.randomUUID(), auditId, vertical: profile.vertical, businessModel: profile.businessModel,
    profileJson: profile, createdAt: now, updatedAt: now,
  }).onConflictDoUpdate({
    target: auditBusinessProfiles.auditId,
    set: { vertical: profile.vertical, businessModel: profile.businessModel, profileJson: profile, updatedAt: now },
  });
}

export async function findBusinessProfile(auditId: string): Promise<BusinessProfile | null> {
  const [record] = await db().select({ profile: auditBusinessProfiles.profileJson })
    .from(auditBusinessProfiles).where(eq(auditBusinessProfiles.auditId, auditId)).limit(1);
  return record?.profile ?? null;
}

export async function findVerifiedLeadForAudit(auditId: string): Promise<LeadRecord | null> {
  const [record] = await db().select().from(leads).where(and(
    eq(leads.auditId, auditId),
    eq(leads.source, 'audit_unlock'),
    sql`${leads.emailVerifiedAt} is not null`,
  )).orderBy(desc(leads.emailVerifiedAt)).limit(1);
  return record ?? null;
}

export async function upsertRoiScenario(input: {
  auditId: string;
  leadId: string;
  inputs: RoiInputs;
  result: RoiScenarioResult;
}): Promise<RoiScenarioRecord> {
  const now = new Date();
  const [record] = await db().insert(roiScenarios).values({
    id: crypto.randomUUID(), auditId: input.auditId, leadId: input.leadId, currency: input.inputs.currency,
    inputsJson: input.inputs, scenarioJson: input.result, completedAt: now, createdAt: now, updatedAt: now,
  }).onConflictDoUpdate({
    target: roiScenarios.auditId,
    set: { leadId: input.leadId, currency: input.inputs.currency, inputsJson: input.inputs, scenarioJson: input.result, completedAt: now, updatedAt: now },
  }).returning();
  if (!record) throw new Error('ROI scenario was not stored.');
  return record;
}

export async function findRoiScenario(auditId: string): Promise<RoiScenarioRecord | null> {
  const [record] = await db().select().from(roiScenarios).where(eq(roiScenarios.auditId, auditId)).limit(1);
  return record ?? null;
}

export async function upsertQualification(input: {
  auditId: string;
  leadId: string;
  qualification: QualificationInput;
}): Promise<LeadQualificationRecord> {
  const now = new Date();
  const [record] = await db().insert(leadQualifications).values({
    id: crypto.randomUUID(), auditId: input.auditId, leadId: input.leadId,
    qualificationJson: input.qualification, completedAt: now, createdAt: now, updatedAt: now,
  }).onConflictDoUpdate({
    target: leadQualifications.leadId,
    set: { qualificationJson: input.qualification, completedAt: now, updatedAt: now },
  }).returning();
  if (!record) throw new Error('Qualification was not stored.');
  await db().update(leads).set({
    investmentBand: input.qualification.investmentBand,
    decisionRole: input.qualification.decisionRole,
    projectTimeline: input.qualification.projectTimeline,
    ...(input.qualification.verticalConfirmed ? { vertical: input.qualification.verticalConfirmed } : {}),
    ...(input.qualification.businessModelConfirmed ? { businessModel: input.qualification.businessModelConfirmed } : {}),
    updatedAt: now,
  }).where(eq(leads.id, input.leadId));
  return record;
}

export async function findQualificationByAudit(auditId: string): Promise<LeadQualificationRecord | null> {
  const [record] = await db().select().from(leadQualifications).where(eq(leadQualifications.auditId, auditId)).orderBy(desc(leadQualifications.completedAt)).limit(1);
  return record ?? null;
}

export async function createBookingIntent(input: {
  auditId: string;
  leadId: string;
  provider: string;
  publicReference: string;
}): Promise<BookingIntentRecord> {
  const now = new Date();
  const [record] = await db().insert(bookingIntents).values({
    id: crypto.randomUUID(), publicReference: input.publicReference, auditId: input.auditId,
    leadId: input.leadId, provider: input.provider, status: 'clicked', clickedAt: now, createdAt: now, updatedAt: now,
  }).returning();
  if (!record) throw new Error('Booking intent was not created.');
  return record;
}

export async function updateBookingIntent(input: {
  publicReference: string;
  status: 'booked' | 'cancelled';
  providerEventId?: string | null;
}): Promise<BookingIntentRecord | null> {
  const now = new Date();
  const [record] = await db().update(bookingIntents).set({
    status: input.status,
    providerEventId: input.providerEventId ?? null,
    bookedAt: input.status === 'booked' ? now : null,
    cancelledAt: input.status === 'cancelled' ? now : null,
    updatedAt: now,
  }).where(eq(bookingIntents.publicReference, input.publicReference)).returning();
  return record ?? null;
}

export async function findLatestBookingIntent(auditId: string): Promise<BookingIntentRecord | null> {
  const [record] = await db().select().from(bookingIntents).where(eq(bookingIntents.auditId, auditId)).orderBy(desc(bookingIntents.createdAt)).limit(1);
  return record ?? null;
}

export async function createOpportunityBrief(input: {
  auditId: string;
  leadId: string;
  brief: OpportunityBriefData;
  publicTokenHash: string;
  expiresAt: Date;
}): Promise<OpportunityBriefRecord> {
  const now = new Date();
  const [record] = await db().insert(opportunityBriefs).values({
    id: crypto.randomUUID(), auditId: input.auditId, leadId: input.leadId, version: input.brief.version,
    briefJson: input.brief, publicTokenHash: input.publicTokenHash, generatedAt: now,
    expiresAt: input.expiresAt, createdAt: now,
  }).returning();
  if (!record) throw new Error('Opportunity brief was not created.');
  return record;
}

export async function findOpportunityBriefByHash(publicTokenHash: string): Promise<OpportunityBriefRecord | null> {
  const now = new Date();
  const [record] = await db().select().from(opportunityBriefs).where(and(
    eq(opportunityBriefs.publicTokenHash, publicTokenHash),
    sql`${opportunityBriefs.expiresAt} > ${now}`,
    isNull(opportunityBriefs.revokedAt),
  )).limit(1);
  if (!record) return null;
  await db().update(opportunityBriefs).set({ lastViewedAt: now }).where(eq(opportunityBriefs.id, record.id));
  return { ...record, lastViewedAt: now };
}

export async function findLatestOpportunityBrief(auditId: string): Promise<OpportunityBriefRecord | null> {
  const [record] = await db().select().from(opportunityBriefs).where(and(
    eq(opportunityBriefs.auditId, auditId), isNull(opportunityBriefs.revokedAt),
  )).orderBy(desc(opportunityBriefs.generatedAt)).limit(1);
  return record ?? null;
}

export async function scheduleFollowUpSequence(lead: LeadRecord): Promise<void> {
  if (!lead.auditId) return;
  const now = Date.now();
  const jobs = [
    { kind: 'roi_reminder', delay: 24 * 60 * 60 * 1000 },
    { kind: 'qualification_reminder', delay: 72 * 60 * 60 * 1000 },
    { kind: 'contextual_solution', delay: 5 * 24 * 60 * 60 * 1000 },
    { kind: 'close_loop', delay: 9 * 24 * 60 * 60 * 1000 },
  ];
  for (const job of jobs) {
    const date = new Date();
    await db().insert(followUpJobs).values({
      id: crypto.randomUUID(), leadId: lead.id, auditId: lead.auditId, kind: job.kind,
      status: 'scheduled', scheduledFor: new Date(now + job.delay), attemptCount: 0,
      templateVersion: 'revenue-v1', contextJson: { origin: lead.auditOriginSnapshot },
      createdAt: date, updatedAt: date,
    }).onConflictDoNothing({ target: [followUpJobs.leadId, followUpJobs.kind] });
  }
}

export async function claimDueFollowUpJobs(limit = 50): Promise<FollowUpJobRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const rows = await db().execute(sql`
    with candidates as (
      select "id"
      from "follow_up_jobs"
      where (
        ("status" = 'scheduled' and "scheduled_for" <= now())
        or ("status" = 'processing' and "processing_lease_until" <= now())
      )
      order by "scheduled_for"
      for update skip locked
      limit ${safeLimit}
    )
    update "follow_up_jobs" as jobs
    set
      "status" = 'processing',
      "processing_lease_until" = now() + interval '10 minutes',
      "attempt_count" = jobs."attempt_count" + 1,
      "updated_at" = now()
    from candidates
    where jobs."id" = candidates."id"
    returning jobs.*
  `);
  return rows as unknown as FollowUpJobRecord[];
}

export async function markFollowUpJob(input: {
  id: string;
  status: 'sent' | 'failed' | 'cancelled' | 'scheduled';
  error?: string | null;
  retryAt?: Date | null;
}): Promise<void> {
  const now = new Date();
  await db().update(followUpJobs).set({
    status: input.status,
    sentAt: input.status === 'sent' ? now : null,
    cancelledAt: input.status === 'cancelled' ? now : null,
    processingLeaseUntil: null,
    ...(input.retryAt ? { scheduledFor: input.retryAt } : {}),
    lastError: input.error?.slice(0, 400) ?? null,
    updatedAt: now,
  }).where(eq(followUpJobs.id, input.id));
}

export async function cancelOpenFollowUps(leadId: string): Promise<void> {
  await db().update(followUpJobs).set({
    status: 'cancelled',
    cancelledAt: new Date(),
    processingLeaseUntil: null,
    updatedAt: new Date(),
  }).where(and(
    eq(followUpJobs.leadId, leadId),
    inArray(followUpJobs.status, ['scheduled', 'processing']),
  ));
}

export async function markMarketingUnsubscribed(leadId: string): Promise<void> {
  await db().update(leads).set({ marketingUnsubscribedAt: new Date(), marketingConsent: false, updatedAt: new Date() })
    .where(eq(leads.id, leadId));
  await cancelOpenFollowUps(leadId);
}

export async function recalculateLeadScores(leadId: string): Promise<LeadRecord | null> {
  const [lead] = await db().select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return null;
  const [profile, qualification, roi, booking, eventRows, manualReview] = await Promise.all([
    lead.auditId ? findBusinessProfile(lead.auditId) : Promise.resolve(null),
    lead.auditId ? findQualificationByAudit(lead.auditId) : Promise.resolve(null),
    lead.auditId ? findRoiScenario(lead.auditId) : Promise.resolve(null),
    lead.auditId ? findLatestBookingIntent(lead.auditId) : Promise.resolve(null),
    lead.auditId ? db().select({ event: funnelEvents.event }).from(funnelEvents).where(eq(funnelEvents.auditId, lead.auditId)) : Promise.resolve([]),
    lead.auditId ? db().select({ count: sql<number>`count(*)::int` }).from(leads).where(and(eq(leads.auditId, lead.auditId), eq(leads.source, 'manual_review'))) : Promise.resolve([{ count: 0 }]),
  ]);
  const q = qualification?.qualificationJson ?? null;
  const result = calculateHighEndLeadScore({
    company: lead.company,
    email: lead.email,
    emailVerified: Boolean(lead.emailVerifiedAt),
    vertical: q?.verticalConfirmed ?? lead.vertical ?? profile?.vertical ?? null,
    businessModel: q?.businessModelConfirmed ?? lead.businessModel ?? profile?.businessModel ?? null,
    investmentBand: q?.investmentBand ?? lead.investmentBand ?? null,
    decisionRole: q?.decisionRole ?? (lead.decisionRole as DecisionRole | null) ?? null,
    projectTimeline: q?.projectTimeline ?? (lead.projectTimeline as ProjectTimeline | null) ?? null,
    averageCustomerValue: roi?.inputsJson.averageCustomerValue ?? null,
    events: eventRows.map((row) => row.event),
    manualReviewRequested: (manualReview[0]?.count ?? 0) > 0,
    bookingCompleted: booking?.status === 'booked',
  });
  const routingStatus = result.priority === 'A' ? 'urgent' : result.priority === 'B' ? 'review' : 'unassigned';
  const [updated] = await db().update(leads).set({
    fitScore: result.fitScore, intentScore: result.intentScore, leadScore: result.total,
    priority: result.priority, scoreReasonsJson: result.reasons, lastScoredAt: new Date(),
    routingStatus, vertical: q?.verticalConfirmed ?? profile?.vertical ?? lead.vertical,
    businessModel: q?.businessModelConfirmed ?? profile?.businessModel ?? lead.businessModel,
    investmentBand: q?.investmentBand ?? lead.investmentBand,
    decisionRole: q?.decisionRole ?? lead.decisionRole,
    projectTimeline: q?.projectTimeline ?? lead.projectTimeline,
    updatedAt: new Date(),
  }).where(eq(leads.id, leadId)).returning();
  return updated ?? null;
}


export async function claimPriorityNotification(leadId: string): Promise<LeadRecord | null> {
  const now = new Date();
  const [record] = await db().update(leads).set({ priorityNotifiedAt: now, updatedAt: now }).where(and(
    eq(leads.id, leadId),
    eq(leads.priority, 'A'),
    isNull(leads.priorityNotifiedAt),
  )).returning();
  return record ?? null;
}

export async function releasePriorityNotification(leadId: string): Promise<void> {
  await db().update(leads).set({ priorityNotifiedAt: null, updatedAt: new Date() }).where(eq(leads.id, leadId));
}

export async function revenueAdminMetrics(): Promise<{
  priorityA: number;
  roiCompleted: number;
  qualifications: number;
  bookingClicks: number;
  bookedCalls: number;
  briefs: number;
}> {
  const [a, roi, qualifications, clicks, booked, briefs] = await Promise.all([
    db().select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.priority, 'A')),
    db().select({ count: sql<number>`count(*)::int` }).from(roiScenarios),
    db().select({ count: sql<number>`count(*)::int` }).from(leadQualifications),
    db().select({ count: sql<number>`count(*)::int` }).from(bookingIntents),
    db().select({ count: sql<number>`count(*)::int` }).from(bookingIntents).where(eq(bookingIntents.status, 'booked')),
    db().select({ count: sql<number>`count(*)::int` }).from(opportunityBriefs),
  ]);
  return { priorityA: a[0]?.count ?? 0, roiCompleted: roi[0]?.count ?? 0, qualifications: qualifications[0]?.count ?? 0, bookingClicks: clicks[0]?.count ?? 0, bookedCalls: booked[0]?.count ?? 0, briefs: briefs[0]?.count ?? 0 };
}

export async function leadRevenueContext(lead: LeadRecord): Promise<{
  roi: RoiScenarioRecord | null;
  qualification: LeadQualificationRecord | null;
  booking: BookingIntentRecord | null;
  brief: OpportunityBriefRecord | null;
}> {
  if (!lead.auditId) return { roi: null, qualification: null, booking: null, brief: null };
  const [roi, qualification, booking, brief] = await Promise.all([
    findRoiScenario(lead.auditId), findQualificationByAudit(lead.auditId),
    findLatestBookingIntent(lead.auditId), findLatestOpportunityBrief(lead.auditId),
  ]);
  return { roi, qualification, booking, brief };
}

export async function countEventsForAudit(auditId: string, events: string[]): Promise<number> {
  const [row] = await db().select({ count: sql<number>`count(*)::int` }).from(funnelEvents)
    .where(and(eq(funnelEvents.auditId, auditId), inArray(funnelEvents.event, events)));
  return row?.count ?? 0;
}

