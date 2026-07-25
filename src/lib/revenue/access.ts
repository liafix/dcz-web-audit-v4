import 'server-only';
import { hasReportAccess } from '@/lib/auth/report-access';
import { findAuditByToken } from '@/lib/db/queries';
import { findVerifiedLeadForAudit } from '@/lib/db/revenue-queries';
import { PublicAppError } from '@/lib/errors/public-error';

export async function requireRevenueAudit(publicToken: string) {
  const audit = await findAuditByToken(publicToken);
  if (!audit || audit.status !== 'ready' || !audit.reportJson || !audit.evidenceJson) {
    throw new PublicAppError({ code: 'audit_not_ready', status: 404, publicMessage: 'Výsledok nie je dostupný.' });
  }
  if (audit.expiresAt <= new Date()) {
    throw new PublicAppError({ code: 'audit_expired', status: 410, publicMessage: 'Platnosť výsledku vypršala.' });
  }
  if (!(await hasReportAccess(audit.id))) {
    throw new PublicAppError({ code: 'report_access_required', status: 401, publicMessage: 'Najskôr si overte e-mail a odomknite celý výsledok.' });
  }
  const lead = await findVerifiedLeadForAudit(audit.id);
  if (!lead) {
    throw new PublicAppError({ code: 'verified_lead_required', status: 409, publicMessage: 'Overený kontakt sa nenašiel.' });
  }
  return { audit, lead };
}
