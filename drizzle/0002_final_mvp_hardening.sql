ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "failure_error_id" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_contacted_at" timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_last_contacted_idx" ON "leads" ("last_contacted_at");
