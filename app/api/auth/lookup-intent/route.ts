import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/lookup-intent
 *
 * Given an email, returns whether the account exists and (if so) whether it
 * is a candidate or employer. Used by the universal /signin page to route
 * the user to the correct verify page.
 *
 * Returns:
 *   { exists: false, intent: 'unknown' }  - no such account
 *   { exists: true,  intent: 'candidate' }
 *   { exists: true,  intent: 'employer' }
 *
 * Security note: This intentionally leaks whether an email is registered.
 * That tradeoff is acceptable for this product because:
 *   1. The user just typed the email themselves
 *   2. Without this lookup we can't route them anywhere useful
 *   3. The actual sensitive bits (verification status, profile data)
 *      remain protected by RLS and require a valid OTP session
 */
export async function POST(request: Request) {
  let email = ''
  try {
    const body = await request.json()
    email = (body?.email ?? '').toString().toLowerCase().trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check candidate_profiles first
  const { data: candidate } = await admin
    .from('candidate_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (candidate) {
    return NextResponse.json({ exists: true, intent: 'candidate' })
  }

  // Check employer_profiles
  const { data: employer } = await admin
    .from('employer_profiles')
    .select('id')
    .eq('work_email', email)
    .maybeSingle()

  if (employer) {
    return NextResponse.json({ exists: true, intent: 'employer' })
  }

  // Fall back to checking auth.users — the account may exist in auth but
  // never had a profile created (e.g. signup race condition). In that case
  // we can still let them sign in, then the dashboard self-heal will create
  // the profile from user_metadata.
  const { data: usersResp } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const authUser = usersResp?.users?.find(
    (u) => u.email?.toLowerCase() === email
  )

  if (authUser) {
    const meta = (authUser.user_metadata ?? {}) as { intent?: string }
    const intent =
      meta.intent === 'employer'
        ? 'employer'
        : meta.intent === 'candidate'
        ? 'candidate'
        : 'candidate' // default to candidate if no intent metadata
    return NextResponse.json({ exists: true, intent })
  }

  return NextResponse.json({ exists: false, intent: 'unknown' })
}
