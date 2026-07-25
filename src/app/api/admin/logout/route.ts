import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth/admin-session';
import { assertSameOrigin } from '@/lib/security/request-origin';

export async function POST(request: Request) {
  assertSameOrigin(request);
  await clearAdminSession();
  return NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 });
}
