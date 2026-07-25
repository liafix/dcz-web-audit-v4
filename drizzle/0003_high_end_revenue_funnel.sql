ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "marketing_unsubscribed_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fit_score" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "intent_score" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'nurture' NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "score_reasons_json" jsonb;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_scored_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "priority_notified_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "routing_status" text DEFAULT 'unassigned' NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "vertical" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "business_model" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "investment_band" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "decision_role" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "project_timeline" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_priority_idx" ON "leads" ("priority");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_fit_score_idx" ON "leads" ("fit_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_intent_score_idx" ON "leads" ("intent_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_routing_status_idx" ON "leads" ("routing_status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_business_profiles" (
  "id" uuid PRIMARY KEY NOT NULL,
  "audit_id" uuid NOT NULL REFERENCES "audits"("id") ON DELETE CASCADE,
  "vertical" text NOT NULL,
  "business_model" text NOT NULL,
  "profile_json" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "audit_business_profiles_audit_unique" ON "audit_business_profiles" ("audit_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_business_profiles_vertical_idx" ON "audit_business_profiles" ("vertical");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roi_scenarios" (
  "id" uuid PRIMARY KEY NOT NULL,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "lead_id" uuid REFERENCES "leads"("id") ON DELETE CASCADE,
  "currency" text DEFAULT 'EUR' NOT NULL,
  "inputs_json" jsonb NOT NULL,
  "scenario_json" jsonb NOT NULL,
  "completed_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roi_scenarios_audit_unique" ON "roi_scenarios" ("audit_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roi_scenarios_lead_idx" ON "roi_scenarios" ("lead_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_qualifications" (
  "id" uuid PRIMARY KEY NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "qualification_json" jsonb NOT NULL,
  "completed_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lead_qualifications_lead_unique" ON "lead_qualifications" ("lead_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_qualifications_audit_idx" ON "lead_qualifications" ("audit_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_intents" (
  "id" uuid PRIMARY KEY NOT NULL,
  "public_reference" text NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "provider" text NOT NULL,
  "status" text DEFAULT 'clicked' NOT NULL,
  "clicked_at" timestamptz NOT NULL,
  "booked_at" timestamptz,
  "cancelled_at" timestamptz,
  "provider_event_id" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "booking_intents_reference_unique" ON "booking_intents" ("public_reference");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_intents_status_idx" ON "booking_intents" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_intents_lead_idx" ON "booking_intents" ("lead_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_briefs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "version" text NOT NULL,
  "brief_json" jsonb NOT NULL,
  "public_token_hash" text NOT NULL,
  "generated_at" timestamptz NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_viewed_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "opportunity_briefs_token_unique" ON "opportunity_briefs" ("public_token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_briefs_audit_idx" ON "opportunity_briefs" ("audit_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_briefs_expiry_idx" ON "opportunity_briefs" ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follow_up_jobs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "kind" text NOT NULL,
  "status" text DEFAULT 'scheduled' NOT NULL,
  "scheduled_for" timestamptz NOT NULL,
  "sent_at" timestamptz,
  "cancelled_at" timestamptz,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "template_version" text NOT NULL,
  "context_json" jsonb,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_jobs_schedule_idx" ON "follow_up_jobs" ("status", "scheduled_for");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "follow_up_jobs_lead_kind_unique" ON "follow_up_jobs" ("lead_id", "kind");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_jobs_lead_idx" ON "follow_up_jobs" ("lead_id");
