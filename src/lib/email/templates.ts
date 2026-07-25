import type { AuditRecord, LeadRecord } from '@/lib/db/schema';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shell(content: string): string {
  return `<!doctype html><html lang="sk"><body style="margin:0;background:#080b14;color:#e2e8f0;font-family:Arial,sans-serif"><div style="max-width:680px;margin:0 auto;padding:40px 20px"><div style="padding:30px;border:1px solid #26324a;border-radius:22px;background:#11182a"><p style="margin:0 0 20px;color:#7db0ff;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">DCZ WebAudit</p>${content}</div><p style="color:#64748b;font-size:12px;line-height:1.6">Predbežná automatická diagnostika analyzuje verejné signály titulnej stránky a nenahrádza manuálny technický, právny ani obchodný audit.</p></div></body></html>`;
}

export function auditResultEmail(input: { audit: AuditRecord; accessUrl: string }): string {
  const score = input.audit.overallScore === null ? 'nedostatočné dáta' : `${input.audit.overallScore}/100`;
  const coverage = input.audit.reportJson?.overallCoverage ?? null;
  return shell(`
    <h1 style="margin:0;color:white;font-size:28px">Výsledok pre ${escapeHtml(input.audit.origin)}</h1>
    <p style="font-size:16px;line-height:1.7;color:#cbd5e1">Predbežná diagnostika je pripravená. Skóre analyzovaných signálov: <strong style="color:white">${score}</strong>${coverage === null ? '' : ` · pokrytie ${coverage}%`}.</p>
    <p style="margin:28px 0"><a href="${escapeHtml(input.accessUrl)}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#4f8cff;color:white;text-decoration:none;font-weight:700">Overiť e-mail a otvoriť celý výsledok</a></p>
    <p style="font-size:13px;color:#94a3b8;line-height:1.65">Odkaz platí 72 hodín a výsledok odomkne až vaše vedomé potvrdenie. Po otvorení vám vytvoríme bezpečný prístup k tomuto reportu. Ak ste o audit nežiadali, e-mail môžete ignorovať.</p>
  `);
}

export function dczLeadEmail(input: {
  audit: AuditRecord;
  lead: LeadRecord;
  adminUrl: string;
}): string {
  const report = input.audit.reportJson;
  const topFindings = report?.findings.slice(0, 3) ?? [];
  const score = input.audit.overallScore === null ? 'nedostatočné dáta' : `${input.audit.overallScore}/100`;
  return shell(`
    <h1 style="margin:0;color:white;font-size:26px">Nový overený lead z DCZ WebAudit</h1>
    <p style="color:#cbd5e1;line-height:1.8"><strong>E-mail:</strong> ${escapeHtml(input.lead.email)}<br><strong>Meno:</strong> ${escapeHtml(input.lead.name ?? 'neuvedené')}<br><strong>Firma:</strong> ${escapeHtml(input.lead.company ?? 'neuvedená')}<br><strong>Telefón:</strong> ${escapeHtml(input.lead.phone ?? 'neuvedený')}<br><strong>Zdroj:</strong> ${escapeHtml(input.lead.source)}<br><strong>Lead score:</strong> ${input.lead.leadScore}/100<br><strong>Fit / Intent:</strong> ${input.lead.fitScore}/50 · ${input.lead.intentScore}/50<br><strong>Priorita:</strong> ${escapeHtml(input.lead.priority)}</p>
    <div style="margin:22px 0;padding:18px;border-radius:14px;background:#0b1220;border:1px solid #26324a"><p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.12em">Čo chce klient vyriešiť</p><p style="margin:0;color:white;line-height:1.7">${escapeHtml(input.lead.primaryGoal ?? 'Bez doplňujúcej správy.')}</p></div>
    <p style="color:#cbd5e1;line-height:1.8"><strong>Audit:</strong> ${escapeHtml(input.audit.targetUrl)}<br><strong>Skóre analyzovaných signálov:</strong> ${score}${report ? `<br><strong>Pokrytie:</strong> ${report.overallCoverage}%` : ''}<br><strong>UTM:</strong> ${escapeHtml([input.lead.utmSource, input.lead.utmMedium, input.lead.utmCampaign].filter(Boolean).join(' / ') || 'neuvedené')}<br><strong>Referrer:</strong> ${escapeHtml(input.lead.referrerHost ?? 'neuvedený')}</p>
    ${topFindings.length ? `<h2 style="color:white;font-size:18px">Top zistenia</h2><ol style="padding-left:20px;color:#cbd5e1;line-height:1.7">${topFindings.map((finding) => `<li><strong>${escapeHtml(finding.title)}</strong> — ${escapeHtml(finding.status)}</li>`).join('')}</ol>` : ''}
    <p style="margin:28px 0 0"><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;padding:13px 18px;border-radius:12px;background:#4f8cff;color:white;text-decoration:none;font-weight:700">Otvoriť lead v adminovi</a></p>
  `);
}
