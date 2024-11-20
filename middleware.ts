import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Auth pages are accessible without session
  if (req.nextUrl.pathname.startsWith('/(auth)')) {
    return res;
  }

  // API routes require authentication
  if (req.nextUrl.pathname.startsWith('/api/') && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Redirect unauthenticated users to login page
  if (!session && !req.nextUrl.pathname.startsWith('/(auth)/')) {
    return NextResponse.redirect(new URL('/(auth)/signin', req.url));
  }

  return res;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
