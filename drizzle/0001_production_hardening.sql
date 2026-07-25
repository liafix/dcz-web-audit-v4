ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "attempt_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "last_heartbeat_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "processing_lease_until" timestamptz;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "report_version" text;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "utm_source" text;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "utm_medium" text;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "utm_campaign" text;
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "referrer_host" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_processing_lease_idx" ON "audits" ("processing_lease_until");
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "audit_origin_snapshot" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "audit_target_snapshot" text;
--> statement-breakpoint
UPDATE "leads" l SET
  "audit_origin_snapshot" = COALESCE(l."audit_origin_snapshot", a."origin", 'unknown'),
  "audit_target_snapshot" = COALESCE(l."audit_target_snapshot", a."target_url", 'unknown')
FROM "audits" a WHERE l."audit_id" = a."id";
--> statement-breakpoint
UPDATE "leads" SET
  "audit_origin_snapshot" = COALESCE("audit_origin_snapshot", 'unknown'),
  "audit_target_snapshot" = COALESCE("audit_target_snapshot", 'unknown');
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "audit_origin_snapshot" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "audit_target_snapshot" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "email_last_sent_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "email_delivery_status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "email_delivery_error" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "notification_sent_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "notes" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "owner" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "next_action_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_source" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_medium" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_campaign" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "referrer_host" text;
--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_audit_id_fkey";
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "audit_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE SET NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "leads_audit_source_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leads_audit_source_email_unique" ON "leads" ("audit_id", "source", "email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_email_verified_idx" ON "leads" ("email_verified_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_next_action_idx" ON "leads" ("next_action_at");
--> statement-breakpoint
ALTER TABLE "report_access_tokens" ADD COLUMN IF NOT EXISTS "revoked_at" timestamptz;
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
