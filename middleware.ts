import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Supabase session refresh middleware.
 *
 * - Refreshes the user's session token on every request
 * - Guards /admin/* routes: redirects to / if user is not authenticated
 * - Guards /dashboard/* routes: redirects to / if unauthenticated
 *
 * Full admin role check happens inside each admin page/layout via requireAdmin().
 * Middleware only does the lightweight "is user authenticated at all?" check.
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Protect /admin/* — must be authenticated (role check happens inside)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('message', 'Please sign in to access the admin panel.')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect /dashboard/* — must be authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('message', 'Please sign in to access your dashboard.')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
