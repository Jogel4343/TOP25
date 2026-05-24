'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { candidateSignupSchema } from '@/lib/schemas'
import {
  checkEmailDomain,
  outcomeToVerificationType,
} from '@/lib/domain-check'

export type SignupActionState = {
  success: boolean
  email?: string
  error?: string
  fieldErrors?: Partial<Record<string, string[]>>
}

/**
 * Server action: candidate signup + OTP send.
 *
 * Security model:
 * 1. Validate form data (Zod)
 * 2. Check email domain against allowed_domains (server-side)
 * 3. If domain blocked/inactive → return error, do nothing
 * 4. Send OTP via supabase.auth.signInWithOtp (creates/signs-in user)
 * 5. Store pending metadata for use in /api/candidates/finalize
 * 6. Log to verification_events
 */
export async function candidateSignupAction(
  _prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  // Parse form data
  const raw = {
    full_name: formData.get('full_name'),
    school_id: formData.get('school_id'),
    email: formData.get('email'),
    graduation_year: Number(formData.get('graduation_year')),
    major: formData.get('major'),
    linkedin_url: formData.get('linkedin_url'),
  }

  const parsed = candidateSignupSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: 'Please fix the errors below.',
    }
  }

  const { full_name, school_id, email, graduation_year, major, linkedin_url } = parsed.data

  // Domain check — server-side, before any OTP is sent
  const domainResult = await checkEmailDomain(email, school_id)

  // Log the verification event regardless of outcome
  const adminClient = createAdminClient()

  // Handle blocked/inactive outcomes — do NOT send OTP
  if (
    domainResult.outcome === 'school_inactive' ||
    domainResult.outcome === 'domain_inactive'
  ) {
    await adminClient.from('verification_events').insert({
      email,
      school_id,
      domain_checked: email.split('@')[1],
      result: 'blocked',
      metadata: { reason: domainResult.outcome, full_name },
    })

    return {
      success: false,
      error:
        domainResult.outcome === 'school_inactive'
          ? 'This school is not currently accepting new candidates.'
          : 'This email domain is no longer active. Please contact us if you believe this is an error.',
    }
  }

  // For unknown domains, we still send OTP (to confirm inbox) but mark manual_review
  // The finalize route will set status = manual_review
  const shouldSendOtp =
    domainResult.outcome === 'auto_verify_student' ||
    domainResult.outcome === 'auto_verify_alumni' ||
    domainResult.outcome === 'manual_review_alumni' ||
    domainResult.outcome === 'unknown_domain'

  if (!shouldSendOtp) {
    return {
      success: false,
      error: 'Unable to verify your school email. Please contact support.',
    }
  }

  // Determine what verification_type to assign after OTP
  const verificationType = outcomeToVerificationType(domainResult.outcome)

  // Send OTP via Supabase Auth
  // The user metadata is stored and used by the finalize route after OTP confirmation
  const supabase = createClient()
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        intent: 'candidate',
        school_id,
        full_name,
        graduation_year,
        major,
        linkedin_url: linkedin_url ?? null,
        domain_outcome: domainResult.outcome,
        verification_type: verificationType,
        ...(domainResult.outcome !== 'unknown_domain'
          ? { school_id: (domainResult as { school_id: string }).school_id }
          : {}),
      },
    },
  })

  if (otpError) {
    console.error('OTP send error:', otpError)

    await adminClient.from('verification_events').insert({
      email,
      school_id: domainResult.outcome !== 'unknown_domain'
        ? (domainResult as { school_id: string }).school_id
        : null,
      domain_checked: email.split('@')[1],
      result: 'otp_send_failed',
      metadata: { error: otpError.message, outcome: domainResult.outcome },
    })

    return {
      success: false,
      error: 'Failed to send verification email. Please try again in a moment.',
    }
  }

  // Log successful OTP send
  const resultLabel =
    domainResult.outcome === 'auto_verify_student'
      ? 'otp_sent_student'
      : domainResult.outcome === 'auto_verify_alumni'
      ? 'otp_sent_alumni'
      : domainResult.outcome === 'manual_review_alumni'
      ? 'otp_sent_alumni_manual'
      : 'otp_sent_unknown'

  await adminClient.from('verification_events').insert({
    email,
    school_id:
      domainResult.outcome !== 'unknown_domain'
        ? (domainResult as { school_id: string }).school_id
        : null,
    domain_checked: email.split('@')[1],
    result: resultLabel,
    metadata: {
      outcome: domainResult.outcome,
      full_name,
      school_id,
    },
  })

  return { success: true, email }
}
