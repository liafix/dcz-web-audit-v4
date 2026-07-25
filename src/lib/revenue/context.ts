import 'server-only';
import type { AuditRecord, LeadRecord } from '@/lib/db/schema';
import { findLatestBookingIntent, findLatestOpportunityBrief, findQualificationByAudit, findRoiScenario } from '@/lib/db/revenue-queries';
import { matchCaseStudy } from '@/lib/case-studies/match';
import { recommendSolution } from '@/lib/solutions/recommendation';

export async function buildRevenueContext(audit: AuditRecord, lead: LeadRecord | null) {
  const report = audit.reportJson;
  if (!report) throw new Error('Audit report is not available.');
  const [roiRecord, qualificationRecord, booking, brief] = await Promise.all([
    findRoiScenario(audit.id),
    findQualificationByAudit(audit.id),
    findLatestBookingIntent(audit.id),
    findLatestOpportunityBrief(audit.id),
  ]);
  const qualification = qualificationRecord?.qualificationJson ?? null;
  const roi = roiRecord?.scenarioJson ?? null;
  const recommendation = recommendSolution({
    leaks: report.moneyLeaks,
    profile: report.businessProfile,
    qualification,
    roi,
  });
  const caseStudy = matchCaseStudy({ profile: report.businessProfile, leaks: report.moneyLeaks, recommendation });
  return { lead, roiRecord, roi, qualificationRecord, qualification, recommendation, caseStudy, booking, brief };
}
