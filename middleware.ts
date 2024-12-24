import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res }, {
      cookieOptions: {
        name: 'sb-auth-token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      }
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If authenticated and on root route, redirect to /chat
    if (session && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/chat', req.url))
    }

    // If no session and trying to access protected route
    if (!session && req.nextUrl.pathname.startsWith('/chat')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If session exists and trying to access auth routes
    if (session && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register'))) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, clear the invalid cookie and redirect to login
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('sb-auth-token')
    return res
  }
}

export const config = {
  matcher: ['/', '/chat/:path*', '/login', '/register'],
}
