import type { AuditEvidence } from '@/lib/audit/types';

export function EvidenceSummary({ evidence }: { evidence: AuditEvidence }) {
  return <details className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><summary className="cursor-pointer font-semibold text-white">Technická evidencia auditu</summary>
    <div className="mt-5 grid gap-4 text-sm text-slate-400 md:grid-cols-2">
      <p><strong className="text-slate-200">Finálna URL:</strong><br />{evidence.finalUrl}</p><p><strong className="text-slate-200">HTTP / obsah:</strong><br />{evidence.httpStatus} · {evidence.contentType} · {Math.round(evidence.bodyBytes / 1024)} KB</p>
      <p><strong className="text-slate-200">Nadpisy:</strong><br />H1: {evidence.html.h1Count}, spolu: {evidence.html.headings.length}</p><p><strong className="text-slate-200">Formuláre:</strong><br />{evidence.html.formCount} formulárov, {evidence.html.inputCount} polí</p>
      <p><strong className="text-slate-200">Obrázky:</strong><br />{evidence.html.imageCount}, bez alt: {evidence.html.imagesWithoutAlt}</p><p><strong className="text-slate-200">JSON-LD:</strong><br />{evidence.html.schemaTypes.join(', ') || 'nezistené'}</p>
      <p><strong className="text-slate-200">robots.txt:</strong><br />{evidence.technicalFiles.robots.available ? `dostupný${evidence.technicalFiles.robots.discoveredSitemaps.length ? ` · ${evidence.technicalFiles.robots.discoveredSitemaps.length} sitemap odkazov` : ''}` : 'nepotvrdený'}</p>
      <p><strong className="text-slate-200">Sitemap:</strong><br />{evidence.technicalFiles.sitemap.available ? `${evidence.technicalFiles.sitemap.kind} · ${evidence.technicalFiles.sitemap.url}` : 'nepotvrdená'}</p>
      <p><strong className="text-slate-200">Render limit:</strong><br />{evidence.html.likelyJavascriptShell ? 'Stránka pravdepodobne potrebuje JavaScript rendering.' : 'Statický HTML obsah bol dostatočný na základnú analýzu.'}</p>
      <p><strong className="text-slate-200">PageSpeed:</strong><br />{evidence.pageSpeed.available ? 'dostupný' : `nedostupný · ${evidence.pageSpeed.reason ?? 'bez dôvodu'}`}</p>
    </div>
  </details>;
}
