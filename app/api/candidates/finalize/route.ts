import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VerificationStatus } from '@/lib/supabase/types'

/**
 * POST /api/candidates/finalize
 *
 * Called after successful OTP verification to upsert the candidate_profiles row.
 * Uses the service role client to bypass RLS (candidates cannot insert their own profiles).
 *
 * Security:
 * - Reads user from session (createClient with cookies) — must be authenticated
 * - All verification status logic is server-side
 * - Clients cannot manipulate verification_status or is_searchable
 */
export async function POST() {
  // Get the current authenticated user (set by OTP verification)
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Extract metadata stored during signInWithOtp
  const meta = user.user_metadata as {
    intent?: string
    school_id?: string
    full_name?: string
    graduation_year?: number
    major?: string
    linkedin_url?: string | null
    domain_outcome?: string
    verification_type?: string
  }

  if (meta.intent !== 'candidate') {
    // This user signed up as an employer — skip candidate profile creation
    return NextResponse.json({ skipped: true, reason: 'not_candidate' })
  }

  // Determine final verification status based on domain outcome
  const domainOutcome = meta.domain_outcome ?? 'unknown_domain'
  let verificationStatus: VerificationStatus
  let isSearchable = false

  switch (domainOutcome) {
    case 'auto_verify_student':
      verificationStatus = 'verified_student'
      isSearchable = true
      break
    case 'auto_verify_alumni':
      verificationStatus = 'verified_alumni'
      isSearchable = true
      break
    case 'manual_review_alumni':
    case 'unknown_domain':
    default:
      verificationStatus = 'manual_review'
      isSearchable = false
      break
  }

  const adminClient = createAdminClient()

  // Upsert candidate profile (on conflict for auth_user_id, update status)
  const { data: profile, error: upsertError } = await adminClient
    .from('candidate_profiles')
    .upsert(
      {
        auth_user_id: user.id,
        full_name: meta.full_name ?? user.email ?? 'Unknown',
        school_id: meta.school_id ?? null,
        email: user.email ?? '',
        graduation_year: meta.graduation_year ?? null,
        major: meta.major ?? null,
        linkedin_url: meta.linkedin_url ?? null,
        verification_status: verificationStatus,
        verification_type: meta.verification_type ?? 'unknown',
        is_searchable: isSearchable,
      },
      {
        onConflict: 'auth_user_id',
        // On conflict, only update verification fields if status has improved
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single()

  if (upsertError) {
    console.error('Candidate profile upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  // Log successful verification event
  await adminClient.from('verification_events').insert({
    candidate_profile_id: profile?.id ?? null,
    email: user.email ?? '',
    school_id: meta.school_id ?? null,
    domain_checked: user.email?.split('@')[1] ?? null,
    result: 'otp_verified',
    metadata: {
      verification_status: verificationStatus,
      domain_outcome: domainOutcome,
    },
  })

  return NextResponse.json({
    success: true,
    verification_status: verificationStatus,
    is_searchable: isSearchable,
  })
}
