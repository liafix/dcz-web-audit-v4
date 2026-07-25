# Backup and rollback runbook

## Before deployment

Record:

- candidate and previous green Git commit SHA;
- CI run URL;
- release ZIP and verified SHA-256;
- Hostinger environment configuration version;
- current Neon branch/database identifier;
- pre-migration Neon branch or backup.

Never run production migrations without a recoverable database branch or backup.

## Application rollback

1. Stop automatic promotion while the incident is investigated.
2. Redeploy the previous green commit in Hostinger. Do not rewrite or force-push Git history.
3. Restore the previous environment values if configuration changed.
4. Verify `/api/health`, homepage, one audit, report access, admin, e-mail, booking, and cron auth.
5. Keep `NEXT_PUBLIC_PREVENT_INDEXING=true` on any temporary recovery domain.

## Database rollback

Migrations are forward-only and immutable. Prefer a corrective additive migration. If the release
is incompatible or data integrity is at risk:

1. Disable purge and follow-up cron jobs.
2. Restore or promote the pre-migration Neon branch/backup.
3. update `DATABASE_URL` in Hostinger;
4. redeploy the compatible application commit;
5. run integrity and funnel smoke checks before restoring traffic.

## Secret incident

Rotate every affected provider and application secret, revoke relevant sessions/tokens, redeploy,
and review redacted logs. Do not copy secret values into GitHub issues, chat, or incident notes.

## Recovery acceptance

Rollback is complete only after health, database writes, e-mail, booking, admin access, audit
processing, and authenticated cron jobs work on the restored version.
