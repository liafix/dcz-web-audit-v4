import type { AuditStatus } from '@/lib/audit/types';

export const STAGE_LABELS: Record<AuditStatus, string> = {
  created: 'Audit čaká na bezpečné spracovanie',
  validating: 'Bezpečne overujeme adresu a DNS',
  fetching_homepage: 'Načítavame verejnú titulnú stránku',
  checking_technical_files: 'Kontrolujeme robots.txt a sitemap.xml',
  pagespeed: 'Získavame dostupné mobilné metriky',
  extracting: 'Vyhodnocujeme SEO, dôveru a konverzné signály',
  scoring: 'Počítame vysvetliteľné skóre',
  assembling_report: 'Zostavujeme výsledok a dôkazy',
  ready: 'Predbežný výsledok je pripravený',
  failed: 'Audit sa nepodarilo dokončiť',
  expired: 'Platnosť auditu vypršala',
};

export const PROGRESS_STAGES: AuditStatus[] = [
  'validating',
  'fetching_homepage',
  'checking_technical_files',
  'pagespeed',
  'extracting',
  'scoring',
  'assembling_report',
];
