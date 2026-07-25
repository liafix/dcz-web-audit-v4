import type { TechnicalFileEvidence } from '@/lib/audit/types';
import { safeFetchText } from '@/lib/security/safe-fetch';

interface RobotsGroup {
  agents: string[];
  disallows: string[];
}

export function parseRobots(body: string): {
  blocksAll: boolean;
  sitemaps: string[];
} {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === 'sitemap' && value) {
      sitemaps.push(value);
      continue;
    }
    if (key === 'user-agent') {
      if (!current || current.disallows.length > 0) {
        current = { agents: [], disallows: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      continue;
    }
    if (key === 'disallow' && current) current.disallows.push(value);
  }

  const wildcardGroups = groups.filter((group) => group.agents.includes('*'));
  return {
    blocksAll: wildcardGroups.some((group) => group.disallows.some((path) => path === '/')),
    sitemaps: [...new Set(sitemaps)].slice(0, 10),
  };
}

export function sitemapKind(body: string): 'urlset' | 'sitemapindex' | null {
  const lower = body.toLowerCase();
  if (lower.includes('<sitemapindex')) return 'sitemapindex';
  if (lower.includes('<urlset')) return 'urlset';
  return null;
}

export async function inspectTechnicalFiles(
  origin: string,
  deadlineAt?: number,
): Promise<TechnicalFileEvidence> {
  const robotsUrl = new URL('/robots.txt', origin).toString();
  const robotsResult = await Promise.allSettled([
    safeFetchText(robotsUrl, { maxRedirects: 2, timeoutMs: 4_000, maxBytes: 256_000, deadlineAt }),
  ]);

  let robotsBody = '';
  let robotsStatus: number | null = null;
  let robotsAvailable = false;
  if (robotsResult[0]?.status === 'fulfilled') {
    robotsBody = robotsResult[0].value.body;
    robotsStatus = robotsResult[0].value.status;
    robotsAvailable = !/<html[\s>]/i.test(robotsBody);
  }

  const parsedRobots = robotsAvailable
    ? parseRobots(robotsBody)
    : { blocksAll: false, sitemaps: [] as string[] };
  const candidateSitemaps = [
    ...parsedRobots.sitemaps.filter((value) => {
      try {
        return new URL(value, origin).origin === origin;
      } catch {
        return false;
      }
    }),
    new URL('/sitemap.xml', origin).toString(),
  ].map((value) => new URL(value, origin).toString());

  let sitemap: TechnicalFileEvidence['sitemap'] = {
    checked: true,
    available: false,
    status: null,
    kind: null,
    url: null,
  };

  for (const candidate of [...new Set(candidateSitemaps)].slice(0, 2)) {
    try {
      const result = await safeFetchText(candidate, {
        maxRedirects: 2,
        timeoutMs: 4_000,
        maxBytes: 512_000,
        deadlineAt,
      });
      const kind = sitemapKind(result.body);
      if (kind) {
        sitemap = {
          checked: true,
          available: true,
          status: result.status,
          kind,
          url: result.finalUrl,
        };
        break;
      }
      if (sitemap.status === null) sitemap.status = result.status;
    } catch {
      // Try the next same-origin candidate.
    }
  }

  return {
    robots: {
      checked: true,
      available: robotsAvailable,
      status: robotsStatus,
      containsSitemap: robotsAvailable ? parsedRobots.sitemaps.length > 0 : null,
      blocksAll: robotsAvailable ? parsedRobots.blocksAll : null,
      discoveredSitemaps: parsedRobots.sitemaps,
    },
    sitemap,
  };
}
