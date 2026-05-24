import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stripe, PRICING } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkoutSchema } from '@/lib/schemas'
import { absoluteUrl } from '@/lib/utils'

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for a job posting.
 * Returns { url } — the Stripe-hosted checkout URL.
 *
 * Security:
 * - Requires authenticated employer session
 * - Verifies the job belongs to the authenticated employer
 * - Pricing is determined server-side from PRICING config — never from client
 */
export async function POST(request: NextRequest) {
  // Validate session
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { job_id, pricing_tier } = parsed.data

  // Get employer profile
  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('id, company_name')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!employerProfile) {
    return NextResponse.json({ error: 'Employer profile not found' }, { status: 403 })
  }

  // Verify the job belongs to this employer and is in the right status
  const adminClient = createAdminClient()
  const { data: job } = await adminClient
    .from('jobs')
    .select('id, title, slug, status, employer_id')
    .eq('id', job_id)
    .eq('employer_id', employerProfile.id)
    .in('status', ['pending_payment', 'expired', 'draft']) // can only checkout these statuses
    .single()

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found or not eligible for payment' },
      { status: 404 }
    )
  }

  // Get pricing from server config — never trust client pricing
  const pricingConfig = PRICING[pricing_tier]
  if (!pricingConfig) {
    return NextResponse.json({ error: 'Invalid pricing tier' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Top25 Talent — ${pricingConfig.name}`,
            description: `${job.title} — 30-day listing${pricingConfig.isFeatured ? ' (Featured)' : ''}`,
            metadata: {
              job_id: job.id,
              job_title: job.title,
            },
          },
          unit_amount: pricingConfig.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      job_id: job.id,
      employer_id: employerProfile.id,
      pricing_tier,
      user_id: user.id,
    },
    customer_email: user.email,
    success_url: absoluteUrl(`/dashboard/employer/jobs/${job.id}/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: absoluteUrl(`/dashboard/employer/jobs/${job.id}/checkout`),
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
