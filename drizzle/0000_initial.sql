CREATE TABLE IF NOT EXISTS "audits" (
  "id" uuid PRIMARY KEY NOT NULL,
  "public_token" text NOT NULL,
  "target_url" text NOT NULL,
  "normalized_url" text NOT NULL,
  "origin" text NOT NULL,
  "status" text NOT NULL,
  "current_stage" text NOT NULL,
  "deduplication_key" text NOT NULL,
  "request_fingerprint" text NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "last_heartbeat_at" timestamptz,
  "processing_lease_until" timestamptz,
  "overall_score" integer,
  "confidence" integer,
  "report_version" text,
  "report_json" jsonb,
  "evidence_json" jsonb,
  "provider_status" jsonb,
  "failure_code" text,
  "failure_message" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "referrer_host" text,
  "created_at" timestamptz NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "expires_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "audits_public_token_unique" ON "audits" ("public_token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_status_idx" ON "audits" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_origin_idx" ON "audits" ("origin");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_deduplication_idx" ON "audits" ("deduplication_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_fingerprint_idx" ON "audits" ("request_fingerprint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_processing_lease_idx" ON "audits" ("processing_lease_until");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_expires_idx" ON "audits" ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_created_idx" ON "audits" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY NOT NULL,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "audit_origin_snapshot" text NOT NULL,
  "audit_target_snapshot" text NOT NULL,
  "email" text NOT NULL,
  "email_verified_at" timestamptz,
  "email_last_sent_at" timestamptz,
  "email_delivery_status" text DEFAULT 'pending' NOT NULL,
  "email_delivery_error" text,
  "notification_sent_at" timestamptz,
  "name" text,
  "company" text,
  "phone" text,
  "primary_goal" text,
  "source" text NOT NULL,
  "stage" text NOT NULL,
  "notes" text,
  "owner" text,
  "next_action_at" timestamptz,
  "marketing_consent" boolean DEFAULT false NOT NULL,
  "consent_version" text NOT NULL,
  "consent_at" timestamptz NOT NULL,
  "lead_score" integer NOT NULL,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "referrer_host" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leads_audit_source_email_unique" ON "leads" ("audit_id", "source", "email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_email_verified_idx" ON "leads" ("email_verified_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_stage_idx" ON "leads" ("stage");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_next_action_idx" ON "leads" ("next_action_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_created_idx" ON "leads" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_access_tokens" (
  "id" uuid PRIMARY KEY NOT NULL,
  "audit_id" uuid NOT NULL REFERENCES "audits"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "report_access_token_hash_unique" ON "report_access_tokens" ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_access_audit_idx" ON "report_access_tokens" ("audit_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_access_expires_idx" ON "report_access_tokens" ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "funnel_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "event" text NOT NULL,
  "session_hash" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "referrer_host" text,
  "metadata" jsonb,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_event_idx" ON "funnel_events" ("event");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_audit_idx" ON "funnel_events" ("audit_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_created_idx" ON "funnel_events" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "action" text NOT NULL,
  "subject_hash" text NOT NULL,
  "audit_id" uuid REFERENCES "audits"("id") ON DELETE SET NULL,
  "success" boolean DEFAULT false NOT NULL,
  "metadata" jsonb,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_action_subject_idx" ON "security_events" ("action", "subject_hash", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_events_created_idx" ON "security_events" ("created_at");
