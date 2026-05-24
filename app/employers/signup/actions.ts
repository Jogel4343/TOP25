'use server'

import { createClient } from '@/lib/supabase/server'
import { employerSignupSchema } from '@/lib/schemas'

export type EmployerSignupState = {
  success: boolean
  email?: string
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
}

/**
 * Server action: employer signup.
 * No domain restriction — any work email can become an employer.
 * Sends OTP for email verification, just like candidates.
 * After OTP, /api/employers/finalize creates the employer_profile row.
 */
export async function employerSignupAction(
  _prevState: EmployerSignupState,
  formData: FormData
): Promise<EmployerSignupState> {
  const raw = {
    work_email: formData.get('work_email'),
    company_name: formData.get('company_name'),
    website_url: formData.get('website_url'),
  }

  const parsed = employerSignupSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: 'Please fix the errors below.',
    }
  }

  const { work_email, company_name, website_url } = parsed.data

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: work_email,
    options: {
      shouldCreateUser: true,
      data: {
        intent: 'employer',
        company_name,
        website_url: website_url ?? null,
        work_email,
      },
    },
  })

  if (error) {
    return {
      success: false,
      error: 'Failed to send verification email. Please try again.',
    }
  }

  return { success: true, email: work_email }
}
