import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { createClient } from './utils/supabase/client';

export async function middleware(req: NextRequest) {
  //update session
  const response = await updateSession(req);

  const protectedPaths = ["/chat"];
  const isProtectedRoute = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));

  if (isProtectedRoute) {
    const supabse = createClient();
    const {
      data: { session },
    } = await supabse.auth.refreshSession();

    if (!session) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/login",
    "/register",
  ]
};