import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';
import { assertPublicIp } from '@/lib/security/ip-policy';

export interface NormalizedTarget {
  url: string;
  origin: string;
  hostname: string;
  port: number;
  protocol: 'http:' | 'https:';
}

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.azure.internal',
]);

export function normalizeUrl(input: string): NormalizedTarget {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new Error('Zadajte platnú URL webstránky.');
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('URL sa nepodarilo rozpoznať.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Povolené sú iba adresy HTTP a HTTPS.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URL nesmie obsahovať prihlasovacie údaje.');
  }

  const asciiHost = domainToASCII(parsed.hostname.toLowerCase());
  if (
    !asciiHost ||
    LOCAL_HOSTNAMES.has(asciiHost) ||
    ['.localhost', '.local', '.internal', '.home.arpa', '.test', '.invalid'].some((suffix) =>
      asciiHost.endsWith(suffix),
    )
  ) {
    throw new Error('Lokálne a interné adresy nie je možné auditovať.');
  }

  if (isIP(asciiHost)) {
    assertPublicIp(asciiHost);
  }

  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  if (![80, 443].includes(port)) {
    throw new Error('Audit podporuje iba štandardné porty 80 a 443.');
  }

  parsed.hostname = asciiHost;
  parsed.username = '';
  parsed.password = '';
  parsed.hash = '';
  parsed.search = '';
  if (parsed.pathname === '') parsed.pathname = '/';

  return {
    url: parsed.toString(),
    origin: parsed.origin,
    hostname: asciiHost,
    port,
    protocol: parsed.protocol,
  };
}
