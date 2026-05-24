import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Result of a domain verification check.
 * This is a pure value type — no side effects.
 */
export type DomainCheckResult =
  | {
      outcome: 'auto_verify_student'
      school_id: string
      school_name: string
      domain: string
    }
  | {
      outcome: 'auto_verify_alumni'
      school_id: string
      school_name: string
      domain: string
    }
  | {
      outcome: 'manual_review_alumni'
      school_id: string
      school_name: string
      domain: string
      reason: 'auto_verify_false'
    }
  | {
      outcome: 'unknown_domain'
      domain: string
      reason: 'no_matching_domain'
    }
  | {
      outcome: 'school_inactive'
      domain: string
      school_id: string
      school_name: string
    }
  | {
      outcome: 'domain_inactive'
      domain: string
      school_id: string
      school_name: string
    }

/**
 * Checks a candidate's email domain against the allowed_domains table.
 *
 * Security note: This runs server-side (server action or API route) using
 * the admin client. The result determines whether we call signInWithOtp
 * and what verification_status we assign AFTER OTP verification.
 *
 * The OTP proves inbox ownership. Domain matching (this function) proves
 * school affiliation. Both are required for full verification.
 *
 * @param email - The raw email address submitted by the candidate
 * @param schoolId - The school_id selected by the candidate in the form
 * @returns DomainCheckResult with outcome and relevant metadata
 */
export async function checkEmailDomain(
  email: string,
  schoolId: string
): Promise<DomainCheckResult> {
  // Normalize: lowercase, trim
  const normalizedEmail = email.toLowerCase().trim()
  const domain = extractDomain(normalizedEmail)

  const supabase = createAdminClient()

  // Fetch the school first to validate it's active
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, name, is_active')
    .eq('id', schoolId)
    .single()

  if (schoolError || !school) {
    return {
      outcome: 'unknown_domain',
      domain,
      reason: 'no_matching_domain',
    }
  }

  if (!school.is_active) {
    return {
      outcome: 'school_inactive',
      domain,
      school_id: school.id,
      school_name: school.name,
    }
  }

  // Find matching domain for this school
  // We match on the email domain, checking all active domains for the selected school
  const { data: matchedDomain, error: domainError } = await supabase
    .from('allowed_domains')
    .select('id, domain, domain_type, auto_verify, is_active')
    .eq('school_id', schoolId)
    .eq('domain', domain)
    .single()

  if (domainError || !matchedDomain) {
    // No exact match. Try suffix matching for subdomains.
    // e.g. if user has xyz@haas.berkeley.edu and we have berkeley.edu listed
    const { data: allDomains } = await supabase
      .from('allowed_domains')
      .select('id, domain, domain_type, auto_verify, is_active')
      .eq('school_id', schoolId)
      .eq('is_active', true)

    const suffixMatch = allDomains?.find(
      (d) => domain === d.domain || domain.endsWith(`.${d.domain}`)
    )

    if (!suffixMatch) {
      return {
        outcome: 'unknown_domain',
        domain,
        reason: 'no_matching_domain',
      }
    }

    return evaluateDomainMatch(suffixMatch, domain, school.id, school.name)
  }

  if (!matchedDomain.is_active) {
    return {
      outcome: 'domain_inactive',
      domain,
      school_id: school.id,
      school_name: school.name,
    }
  }

  return evaluateDomainMatch(matchedDomain, domain, school.id, school.name)
}

/**
 * Evaluates a matched domain row and returns the appropriate outcome.
 * Pure function — no DB calls.
 */
function evaluateDomainMatch(
  domainRow: { domain: string; domain_type: string; auto_verify: boolean; is_active: boolean },
  emailDomain: string,
  schoolId: string,
  schoolName: string
): DomainCheckResult {
  if (domainRow.domain_type === 'student') {
    return {
      outcome: 'auto_verify_student',
      school_id: schoolId,
      school_name: schoolName,
      domain: emailDomain,
    }
  }

  if (domainRow.domain_type === 'alumni' || domainRow.domain_type === 'special') {
    if (domainRow.auto_verify) {
      return {
        outcome: 'auto_verify_alumni',
        school_id: schoolId,
        school_name: schoolName,
        domain: emailDomain,
      }
    } else {
      return {
        outcome: 'manual_review_alumni',
        school_id: schoolId,
        school_name: schoolName,
        domain: emailDomain,
        reason: 'auto_verify_false',
      }
    }
  }

  // Fallback
  return {
    outcome: 'unknown_domain',
    domain: emailDomain,
    reason: 'no_matching_domain',
  }
}

/**
 * Extracts the domain part from an email address.
 * Returns lowercase, trimmed domain.
 */
export function extractDomain(email: string): string {
  const parts = email.toLowerCase().trim().split('@')
  if (parts.length !== 2 || !parts[1]) {
    throw new Error(`Invalid email address: ${email}`)
  }
  return parts[1]
}

/**
 * Maps a DomainCheckResult outcome to a verification_status for the DB.
 */
export function outcomeToVerificationStatus(
  outcome: DomainCheckResult['outcome']
): 'verification_sent' | 'manual_review' {
  switch (outcome) {
    case 'auto_verify_student':
    case 'auto_verify_alumni':
    case 'manual_review_alumni':
      return 'verification_sent'
    case 'unknown_domain':
    case 'school_inactive':
    case 'domain_inactive':
      return 'manual_review'
  }
}

/**
 * Maps a DomainCheckResult outcome to verification_type for the DB.
 */
export function outcomeToVerificationType(outcome: DomainCheckResult['outcome']): string {
  switch (outcome) {
    case 'auto_verify_student':
      return 'student_domain'
    case 'auto_verify_alumni':
      return 'alumni_domain'
    case 'manual_review_alumni':
      return 'alumni_manual'
    default:
      return 'unknown'
  }
}
