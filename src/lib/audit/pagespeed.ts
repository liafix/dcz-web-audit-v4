import type { PageSpeedEvidence } from '@/lib/audit/types';

interface LighthouseCategory {
  score?: number | null;
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: LighthouseCategory;
      accessibility?: LighthouseCategory;
      'best-practices'?: LighthouseCategory;
      seo?: LighthouseCategory;
    };
  };
  error?: { message?: string };
}

function score(category: LighthouseCategory | undefined): number | null {
  return typeof category?.score === 'number' ? Math.round(category.score * 100) : null;
}

export async function collectPageSpeed(
  url: string,
  timeoutMs = 10_000,
  deadlineAt?: number,
): Promise<PageSpeedEvidence> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  if (!key) {
    return {
      available: false,
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
      fetchedAt: null,
      reason: 'api_key_not_configured',
    };
  }

  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.set('category', 'performance');
  endpoint.searchParams.append('category', 'accessibility');
  endpoint.searchParams.append('category', 'best-practices');
  endpoint.searchParams.append('category', 'seo');
  endpoint.searchParams.set('key', key);

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      signal: AbortSignal.timeout(
        Math.max(250, Math.min(timeoutMs, deadlineAt ? deadlineAt - Date.now() : timeoutMs)),
      ),
    });
    const data = (await response.json()) as PageSpeedResponse;
    if (!response.ok || data.error) {
      return {
        available: false,
        performance: null,
        accessibility: null,
        bestPractices: null,
        seo: null,
        fetchedAt: null,
        reason: 'api_unavailable',
      };
    }

    const categories = data.lighthouseResult?.categories;
    return {
      available: Boolean(categories),
      performance: score(categories?.performance),
      accessibility: score(categories?.accessibility),
      bestPractices: score(categories?.['best-practices']),
      seo: score(categories?.seo),
      fetchedAt: new Date().toISOString(),
      reason: categories ? null : 'missing_categories',
    };
  } catch {
    return {
      available: false,
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
      fetchedAt: null,
      reason: 'request_failed',
    };
  }
}
