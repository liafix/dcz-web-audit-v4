import { NextResponse } from 'next/server';
import { markMarketingUnsubscribed } from '@/lib/db/revenue-queries';
import { appUrl } from '@/lib/env';
import { verifyUnsubscribeToken } from '@/lib/follow-up/unsubscribe';
import { assertSameOrigin } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await context.params;
    const payload = verifyUnsubscribeToken(token);
    if (!payload) return NextResponse.redirect(new URL('/?unsubscribe=invalid', appUrl()), { status: 303 });
    await markMarketingUnsubscribed(payload.leadId);
    return NextResponse.redirect(new URL('/?unsubscribe=done', appUrl()), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL('/?unsubscribe=failed', appUrl()), { status: 303 });
  }
}
