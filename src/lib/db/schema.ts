import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AuditEvidence, AuditReport, AuditStatus } from '@/lib/audit/types';
import type {
  BusinessModel,
  BusinessProfile,
  BusinessVertical,
  InvestmentBand,
  LeadPriority,
  OpportunityBriefData,
  QualificationInput,
  RoiInputs,
  RoiScenarioResult,
} from '@/lib/revenue/types';

export const audits = pgTable(
  'audits',
  {
    id: uuid('id').primaryKey(),
    publicToken: text('public_token').notNull(),
    targetUrl: text('target_url').notNull(),
    normalizedUrl: text('normalized_url').notNull(),
    origin: text('origin').notNull(),
    status: text('status').$type<AuditStatus>().notNull(),
    currentStage: text('current_stage').$type<AuditStatus>().notNull(),
    deduplicationKey: text('deduplication_key').notNull(),
    requestFingerprint: text('request_fingerprint').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
    processingLeaseUntil: timestamp('processing_lease_until', { withTimezone: true }),
    overallScore: integer('overall_score'),
    confidence: integer('confidence'),
    reportVersion: text('report_version'),
    reportJson: jsonb('report_json').$type<AuditReport | null>(),
    evidenceJson: jsonb('evidence_json').$type<AuditEvidence | null>(),
    providerStatus: jsonb('provider_status').$type<Record<string, unknown> | null>(),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    failureErrorId: text('failure_error_id'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    referrerHost: text('referrer_host'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    publicTokenUnique: uniqueIndex('audits_public_token_unique').on(table.publicToken),
    statusIndex: index('audits_status_idx').on(table.status),
    originIndex: index('audits_origin_idx').on(table.origin),
    deduplicationIndex: index('audits_deduplication_idx').on(table.deduplicationKey),
    fingerprintIndex: index('audits_fingerprint_idx').on(table.requestFingerprint),
    leaseIndex: index('audits_processing_lease_idx').on(table.processingLeaseUntil),
    expiresIndex: index('audits_expires_idx').on(table.expiresAt),
    createdIndex: index('audits_created_idx').on(table.createdAt),
  }),
);

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey(),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    auditOriginSnapshot: text('audit_origin_snapshot').notNull(),
    auditTargetSnapshot: text('audit_target_snapshot').notNull(),
    email: text('email').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    emailLastSentAt: timestamp('email_last_sent_at', { withTimezone: true }),
    emailDeliveryStatus: text('email_delivery_status').notNull().default('pending'),
    emailDeliveryError: text('email_delivery_error'),
    notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),
    name: text('name'),
    company: text('company'),
    phone: text('phone'),
    primaryGoal: text('primary_goal'),
    source: text('source').notNull(),
    stage: text('stage').notNull(),
    notes: text('notes'),
    owner: text('owner'),
    nextActionAt: timestamp('next_action_at', { withTimezone: true }),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
    marketingConsent: boolean('marketing_consent').notNull().default(false),
    marketingUnsubscribedAt: timestamp('marketing_unsubscribed_at', { withTimezone: true }),
    consentVersion: text('consent_version').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    leadScore: integer('lead_score').notNull(),
    fitScore: integer('fit_score').notNull().default(0),
    intentScore: integer('intent_score').notNull().default(0),
    priority: text('priority').$type<LeadPriority>().notNull().default('nurture'),
    scoreReasonsJson: jsonb('score_reasons_json').$type<string[] | null>(),
    lastScoredAt: timestamp('last_scored_at', { withTimezone: true }),
    priorityNotifiedAt: timestamp('priority_notified_at', { withTimezone: true }),
    routingStatus: text('routing_status').notNull().default('unassigned'),
    vertical: text('vertical').$type<BusinessVertical>(),
    businessModel: text('business_model').$type<BusinessModel>(),
    investmentBand: text('investment_band').$type<InvestmentBand>(),
    decisionRole: text('decision_role'),
    projectTimeline: text('project_timeline'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    referrerHost: text('referrer_host'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    auditSourceEmailUnique: uniqueIndex('leads_audit_source_email_unique').on(table.auditId, table.source, table.email),
    emailIndex: index('leads_email_idx').on(table.email),
    verifiedIndex: index('leads_email_verified_idx').on(table.emailVerifiedAt),
    stageIndex: index('leads_stage_idx').on(table.stage),
    priorityIndex: index('leads_priority_idx').on(table.priority),
    fitScoreIndex: index('leads_fit_score_idx').on(table.fitScore),
    intentScoreIndex: index('leads_intent_score_idx').on(table.intentScore),
    routingIndex: index('leads_routing_status_idx').on(table.routingStatus),
    nextActionIndex: index('leads_next_action_idx').on(table.nextActionAt),
    createdIndex: index('leads_created_idx').on(table.createdAt),
  }),
);

export const reportAccessTokens = pgTable(
  'report_access_tokens',
  {
    id: uuid('id').primaryKey(),
    auditId: uuid('audit_id').notNull().references(() => audits.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex('report_access_token_hash_unique').on(table.tokenHash),
    auditIndex: index('report_access_audit_idx').on(table.auditId),
    expiresIndex: index('report_access_expires_idx').on(table.expiresAt),
  }),
);

export const funnelEvents = pgTable(
  'funnel_events',
  {
    id: uuid('id').primaryKey(),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    event: text('event').notNull(),
    sessionHash: text('session_hash'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    referrerHost: text('referrer_host'),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    eventIndex: index('funnel_events_event_idx').on(table.event),
    auditIndex: index('funnel_events_audit_idx').on(table.auditId),
    createdIndex: index('funnel_events_created_idx').on(table.createdAt),
  }),
);

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').primaryKey(),
    action: text('action').notNull(),
    subjectHash: text('subject_hash').notNull(),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    success: boolean('success').notNull().default(false),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    actionSubjectIndex: index('security_events_action_subject_idx').on(table.action, table.subjectHash, table.createdAt),
    createdIndex: index('security_events_created_idx').on(table.createdAt),
  }),
);

export const auditBusinessProfiles = pgTable(
  'audit_business_profiles',
  {
    id: uuid('id').primaryKey(),
    auditId: uuid('audit_id').notNull().references(() => audits.id, { onDelete: 'cascade' }),
    vertical: text('vertical').$type<BusinessVertical>().notNull(),
    businessModel: text('business_model').$type<BusinessModel>().notNull(),
    profileJson: jsonb('profile_json').$type<BusinessProfile>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    auditUnique: uniqueIndex('audit_business_profiles_audit_unique').on(table.auditId),
    verticalIndex: index('audit_business_profiles_vertical_idx').on(table.vertical),
  }),
);

export const roiScenarios = pgTable(
  'roi_scenarios',
  {
    id: uuid('id').primaryKey(),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    currency: text('currency').notNull().default('EUR'),
    inputsJson: jsonb('inputs_json').$type<RoiInputs>().notNull(),
    scenarioJson: jsonb('scenario_json').$type<RoiScenarioResult>().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    auditUnique: uniqueIndex('roi_scenarios_audit_unique').on(table.auditId),
    leadIndex: index('roi_scenarios_lead_idx').on(table.leadId),
  }),
);

export const leadQualifications = pgTable(
  'lead_qualifications',
  {
    id: uuid('id').primaryKey(),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    qualificationJson: jsonb('qualification_json').$type<QualificationInput>().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    leadUnique: uniqueIndex('lead_qualifications_lead_unique').on(table.leadId),
    auditIndex: index('lead_qualifications_audit_idx').on(table.auditId),
  }),
);

export const bookingIntents = pgTable(
  'booking_intents',
  {
    id: uuid('id').primaryKey(),
    publicReference: text('public_reference').notNull(),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(),
    status: text('status').notNull().default('clicked'),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull(),
    bookedAt: timestamp('booked_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    providerEventId: text('provider_event_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    referenceUnique: uniqueIndex('booking_intents_reference_unique').on(table.publicReference),
    statusIndex: index('booking_intents_status_idx').on(table.status),
    leadIndex: index('booking_intents_lead_idx').on(table.leadId),
  }),
);

export const opportunityBriefs = pgTable(
  'opportunity_briefs',
  {
    id: uuid('id').primaryKey(),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    briefJson: jsonb('brief_json').$type<OpportunityBriefData>().notNull(),
    publicTokenHash: text('public_token_hash').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    tokenUnique: uniqueIndex('opportunity_briefs_token_unique').on(table.publicTokenHash),
    auditIndex: index('opportunity_briefs_audit_idx').on(table.auditId),
    expiryIndex: index('opportunity_briefs_expiry_idx').on(table.expiresAt),
  }),
);

export const followUpJobs = pgTable(
  'follow_up_jobs',
  {
    id: uuid('id').primaryKey(),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    auditId: uuid('audit_id').references(() => audits.id, { onDelete: 'set null' }),
    kind: text('kind').notNull(),
    status: text('status').notNull().default('scheduled'),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    processingLeaseUntil: timestamp('processing_lease_until', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastError: text('last_error'),
    templateVersion: text('template_version').notNull(),
    contextJson: jsonb('context_json').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    scheduleIndex: index('follow_up_jobs_schedule_idx').on(table.status, table.scheduledFor),
    leaseIndex: index('follow_up_jobs_lease_idx').on(table.processingLeaseUntil),
    leadKindUnique: uniqueIndex('follow_up_jobs_lead_kind_unique').on(table.leadId, table.kind),
    leadIndex: index('follow_up_jobs_lead_idx').on(table.leadId),
  }),
);

export type AuditRecord = typeof audits.$inferSelect;
export type LeadRecord = typeof leads.$inferSelect;
export type RoiScenarioRecord = typeof roiScenarios.$inferSelect;
export type LeadQualificationRecord = typeof leadQualifications.$inferSelect;
export type BookingIntentRecord = typeof bookingIntents.$inferSelect;
export type OpportunityBriefRecord = typeof opportunityBriefs.$inferSelect;
export type FollowUpJobRecord = typeof followUpJobs.$inferSelect;
