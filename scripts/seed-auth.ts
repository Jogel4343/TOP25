/**
 * Seed Auth Script — creates test users in Supabase Auth and linked profiles.
 *
 * Usage:
 *   cp .env.example .env.local
 *   # Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   npx tsx scripts/seed-auth.ts
 *
 * What this does:
 *   1. Creates auth users using the Admin API (bypasses email confirmation)
 *   2. Creates corresponding candidate_profiles and employer_profiles
 *
 * NOTE: This script targets your REAL Supabase project.
 * Only run against a development project, not production.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  console.error('Make sure you have a .env.local file set up.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================
// Test users to create
// ============================================================

const EMPLOYER_USERS = [
  {
    email: 'campus@sequoiacap.com',
    password: 'TestPassword123!',
    profile: {
      company_name: 'Sequoia Capital',
      work_email: 'campus@sequoiacap.com',
      website_url: 'https://sequoiacap.com',
    },
  },
  {
    email: 'recruiting@anthropic.com',
    password: 'TestPassword123!',
    profile: {
      company_name: 'Anthropic',
      work_email: 'recruiting@anthropic.com',
      website_url: 'https://anthropic.com',
    },
  },
  {
    email: 'talent@bwater.com',
    password: 'TestPassword123!',
    profile: {
      company_name: 'Bridgewater Associates',
      work_email: 'talent@bwater.com',
      website_url: 'https://bridgewater.com',
    },
  },
]

const CANDIDATE_USERS = [
  {
    email: 'jordan.blackwell@virginia.edu',
    password: 'TestPassword123!',
    profile: {
      full_name: 'Jordan Blackwell',
      school_short: 'UVA',
      graduation_year: 2025,
      major: 'Economics',
      verification_status: 'verified_student' as const,
      is_searchable: true,
    },
  },
  {
    email: 'priya.mehta@stanford.edu',
    password: 'TestPassword123!',
    profile: {
      full_name: 'Priya Mehta',
      school_short: 'Stanford',
      graduation_year: 2024,
      major: 'Computer Science',
      verification_status: 'verified_student' as const,
      is_searchable: true,
    },
  },
  {
    email: 'marcus.chen@alumni.harvard.edu',
    password: 'TestPassword123!',
    profile: {
      full_name: 'Marcus Chen',
      school_short: 'Harvard',
      graduation_year: 2022,
      major: 'Applied Mathematics',
      verification_status: 'verified_alumni' as const,
      is_searchable: true,
    },
  },
]

// School ID map (from seed data)
const SCHOOL_IDS: Record<string, string> = {
  Harvard: 'a0000001-0000-0000-0000-000000000001',
  MIT: 'a0000001-0000-0000-0000-000000000002',
  Stanford: 'a0000001-0000-0000-0000-000000000003',
  Princeton: 'a0000001-0000-0000-0000-000000000004',
  Yale: 'a0000001-0000-0000-0000-000000000005',
  Columbia: 'a0000001-0000-0000-0000-000000000006',
  UPenn: 'a0000001-0000-0000-0000-000000000007',
  UChicago: 'a0000001-0000-0000-0000-000000000008',
  Duke: 'a0000001-0000-0000-0000-000000000009',
  UVA: 'a0000001-0000-0000-0000-000000000010',
  'UC Berkeley': 'a0000001-0000-0000-0000-000000000011',
  Northwestern: 'a0000001-0000-0000-0000-000000000012',
  Cornell: 'a0000001-0000-0000-0000-000000000013',
}

async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation for seed data
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`  ⚠️  User ${email} already exists, fetching...`)
      // Try to get existing user
      const { data: listData } = await supabase.auth.admin.listUsers()
      const existing = listData?.users.find((u) => u.email === email)
      return existing ?? null
    }
    console.error(`  ✗ Failed to create user ${email}:`, error.message)
    return null
  }

  return data.user
}

async function seedEmployers() {
  console.log('\n🏢 Creating employer accounts...\n')

  for (const emp of EMPLOYER_USERS) {
    console.log(`  Creating ${emp.email}...`)
    const user = await createAuthUser(emp.email, emp.password)

    if (!user) continue

    const { error } = await supabase.from('employer_profiles').upsert(
      {
        auth_user_id: user.id,
        ...emp.profile,
      },
      { onConflict: 'auth_user_id' }
    )

    if (error) {
      console.error(`  ✗ Failed to create employer profile for ${emp.email}:`, error.message)
    } else {
      console.log(`  ✓ ${emp.profile.company_name} (${user.id})`)
    }
  }
}

async function seedCandidates() {
  console.log('\n🎓 Creating candidate accounts...\n')

  for (const cand of CANDIDATE_USERS) {
    console.log(`  Creating ${cand.email}...`)
    const user = await createAuthUser(cand.email, cand.password)

    if (!user) continue

    const schoolId = SCHOOL_IDS[cand.profile.school_short]

    const { error } = await supabase.from('candidate_profiles').upsert(
      {
        auth_user_id: user.id,
        full_name: cand.profile.full_name,
        school_id: schoolId ?? null,
        email: cand.email,
        graduation_year: cand.profile.graduation_year,
        major: cand.profile.major,
        verification_status: cand.profile.verification_status,
        verification_type: cand.profile.verification_status === 'verified_alumni'
          ? 'alumni_domain'
          : 'student_domain',
        is_searchable: cand.profile.is_searchable,
      },
      { onConflict: 'auth_user_id' }
    )

    if (error) {
      console.error(`  ✗ Failed to create candidate profile for ${cand.email}:`, error.message)
    } else {
      console.log(`  ✓ ${cand.profile.full_name} — ${cand.profile.verification_status} (${user.id})`)
    }
  }
}

async function createAdminUser() {
  console.log('\n🔑 Admin user setup...\n')
  console.log('  To make yourself an admin:')
  console.log('  1. Sign up through the app at http://localhost:3000/candidates/signup')
  console.log('  2. Note your auth user UUID from Supabase Dashboard > Authentication > Users')
  console.log('  3. Run this in Supabase SQL Editor:')
  console.log("     INSERT INTO admins (auth_user_id) VALUES ('your-uuid-here');")
  console.log('')
}

async function main() {
  console.log('🌱 Top25 Talent — Seed Script')
  console.log(`   Supabase URL: ${supabaseUrl}`)
  console.log('')

  await seedEmployers()
  await seedCandidates()
  await createAdminUser()

  console.log('\n✅ Seed complete!\n')
  console.log('Test credentials:')
  console.log('  Employers: campus@sequoiacap.com / TestPassword123!')
  console.log('  Candidates: jordan.blackwell@virginia.edu / TestPassword123!')
}

main().catch(console.error)
