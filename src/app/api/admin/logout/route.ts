import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth/admin-session';
import { appUrl } from '@/lib/env';
import { assertSameOrigin } from '@/lib/security/request-origin';

export async function POST(request: Request) {
  assertSameOrigin(request);
  await clearAdminSession();
  return NextResponse.redirect(new URL('/admin/login', appUrl()), { status: 303 });
}
