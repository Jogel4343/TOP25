import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { User } from '@supabase/supabase-js'
import type { CandidateProfile, EmployerProfile } from '@/lib/supabase/types'

/**
 * Returns the current user or null if not authenticated.
 * Never throws — safe to call in layouts and pages.
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Returns the current user or redirects to /candidates/signup.
 * Use in protected pages.
 */
export async function requireUser(redirectTo = '/'): Promise<User> {
  const user = await getUser()
  if (!user) {
    redirect(redirectTo)
  }
  return user
}

/**
 * Returns the current user's candidate profile, or null.
 * Does not redirect.
 */
export async function getCandidateProfile(): Promise<CandidateProfile | null> {
  const user = await getUser()
  if (!user) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return data ?? null
}

/**
 * Returns the current user's employer profile, or null.
 */
export async function getEmployerProfile(): Promise<EmployerProfile | null> {
  const user = await getUser()
  if (!user) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return data ?? null
}

/**
 * Requires an authenticated user with a verified candidate profile.
 * Redirects to /candidates/signup if not authenticated.
 * Redirects to /candidates/verify if verification not complete.
 */
export async function requireCandidate(): Promise<{ user: User; profile: CandidateProfile }> {
  const user = await requireUser('/candidates/signup')
  const profile = await getCandidateProfile()

  if (!profile) {
    redirect('/candidates/signup')
  }

  if (
    profile.verification_status !== 'verified_student' &&
    profile.verification_status !== 'verified_alumni'
  ) {
    redirect('/candidates/verify')
  }

  return { user, profile }
}

/**
 * Requires an authenticated user with an active employer profile.
 * Redirects to /employers/signup if not set up.
 */
export async function requireEmployer(): Promise<{ user: User; profile: EmployerProfile }> {
  const user = await requireUser('/employers/signup')
  const profile = await getEmployerProfile()

  if (!profile || !profile.is_active) {
    redirect('/employers/signup')
  }

  return { user, profile }
}

/**
 * Returns true if the current user is an admin.
 * Uses the admin client to bypass RLS.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const admin = createAdminClient()
  const { data } = await admin
    .from('admins')
    .select('auth_user_id')
    .eq('auth_user_id', user.id)
    .single()

  return !!data
}

/**
 * Requires an authenticated admin user.
 * Redirects to / if not admin.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser('/')
  const admin = await isAdmin()

  if (!admin) {
    redirect('/')
  }

  return user
}

/**
 * Signs the current user out and redirects to the home page.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
