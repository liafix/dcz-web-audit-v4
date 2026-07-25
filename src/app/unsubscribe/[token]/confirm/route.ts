import { NextResponse } from 'next/server';
import { markMarketingUnsubscribed } from '@/lib/db/revenue-queries';
import { verifyUnsubscribeToken } from '@/lib/follow-up/unsubscribe';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const payload = verifyUnsubscribeToken(token);
    if (!payload) return NextResponse.redirect(new URL('/?unsubscribe=invalid', request.url), { status: 303 });
    await markMarketingUnsubscribed(payload.leadId);
    return NextResponse.redirect(new URL('/?unsubscribe=done', request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL('/?unsubscribe=failed', request.url), { status: 303 });
  }
}
