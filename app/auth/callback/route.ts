import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback route — handles magic link redirects.
 *
 * This route is used as a fallback if the user clicks a magic link email
 * instead of entering the OTP code. Supabase sends both a magic link and
 * an OTP — this handles the magic link path.
 *
 * Flow:
 *   1. Supabase sends email with link: https://your-site/auth/callback?code=...
 *   2. This route exchanges the code for a session
 *   3. Redirects to the appropriate dashboard based on profile type
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type') // 'candidate' | 'employer' | undefined

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is a candidate or employer flow
      // If type is specified in the URL, use it; otherwise check existing profiles
      if (type === 'candidate' || next.includes('candidate')) {
        // Call finalize route to upsert candidate profile
        const finalizeUrl = new URL('/api/candidates/finalize', origin)
        const finalizeResponse = await fetch(finalizeUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (finalizeResponse.ok) {
          return NextResponse.redirect(new URL('/dashboard/candidate', origin))
        }
      }

      // Default: redirect to next or home
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Auth error — redirect to error page
  return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
}
