import { PublicAppError } from '@/lib/errors/public-error';

export async function readJsonBody(request: Request, maxBytes = 24_000): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new PublicAppError({
      code: 'request_too_large',
      status: 413,
      publicMessage: 'Odoslané údaje sú príliš veľké.',
    });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    throw new PublicAppError({
      code: 'request_too_large',
      status: 413,
      publicMessage: 'Odoslané údaje sú príliš veľké.',
    });
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new PublicAppError({
      code: 'invalid_json',
      status: 400,
      publicMessage: 'Požiadavka má neplatný formát.',
    });
  }
}
