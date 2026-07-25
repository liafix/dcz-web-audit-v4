import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';
import { assertPublicIp } from '@/lib/security/ip-policy';

export interface ResolvedAddress { address: string; family: 4 | 6; }

async function withDnsTimeout<T>(promise: Promise<T>, timeoutMs = 4_000): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DNS resolution timed out.')), timeoutMs);
        timer.unref();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function resolvePublicHost(
  hostname: string,
  timeoutMs = 4_000,
): Promise<ResolvedAddress[]> {
  if (isIP(hostname)) {
    assertPublicIp(hostname);
    return [{ address: hostname, family: isIP(hostname) as 4 | 6 }];
  }

  const [v4, v6] = await Promise.allSettled([
    withDnsTimeout(resolve4(hostname), timeoutMs),
    withDnsTimeout(resolve6(hostname), timeoutMs),
  ]);
  const addresses: ResolvedAddress[] = [];
  const addAddress = (address: string, family: 4 | 6): void => {
    assertPublicIp(address);
    if (!addresses.some((item) => item.address === address)) addresses.push({ address, family });
  };

  if (v4.status === 'fulfilled') for (const address of v4.value) addAddress(address, 4);
  if (v6.status === 'fulfilled') for (const address of v6.value) addAddress(address, 6);
  if (addresses.length === 0) throw new Error('Doména nemá dostupný verejný DNS záznam.');
  return addresses;
}
