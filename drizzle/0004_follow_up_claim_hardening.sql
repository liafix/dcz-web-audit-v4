ALTER TABLE "follow_up_jobs" ADD COLUMN IF NOT EXISTS "processing_lease_until" timestamptz;
--> statement-breakpoint
UPDATE "follow_up_jobs"
SET "status" = 'scheduled', "processing_lease_until" = NULL
WHERE "status" = 'processing';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_up_jobs_lease_idx" ON "follow_up_jobs" ("processing_lease_until");
