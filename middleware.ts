import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Forward requests to /api/chat to your FastAPI backend
  if (pathname === '/api/chat') {
    // Assuming your FastAPI server is running on a different port or domain
    // For local development you might use something like http://localhost:8000
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    
    // Create the URL to forward to
    const url = new URL(`${apiUrl}/api/chat`);
    
    // Return a rewrite response
    return NextResponse.rewrite(url);
  }

  // For all other paths, use the existing session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/api/chat',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};