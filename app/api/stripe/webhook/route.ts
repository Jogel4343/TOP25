import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events.
 * The ONLY place that activates a job listing after payment.
 *
 * Security:
 * - Verifies Stripe webhook signature using raw body + STRIPE_WEBHOOK_SECRET
 * - Uses admin Supabase client (service role) for all DB writes
 * - Never trusts client-provided data — all relevant info from Stripe session metadata
 *
 * IMPORTANT: Next.js App Router does NOT automatically parse the body.
 * We must read the raw body as text and pass it to constructEvent.
 * Do NOT use NextResponse.json() intermediate parsing.
 */
export async function POST(request: NextRequest) {
  // Read raw body as text — critical for Stripe signature verification
  const rawBody = await request.text()

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    console.error('Stripe webhook: missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Verify signature — this throws if invalid
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Stripe webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  // Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    // Return 200 for unhandled events (Stripe will not retry)
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Extract metadata stored during checkout session creation
  const { job_id, employer_id, pricing_tier } = session.metadata ?? {}

  if (!job_id || !employer_id || !pricing_tier) {
    console.error('Stripe webhook: missing metadata in session', { metadata: session.metadata })
    return NextResponse.json({ error: 'Missing session metadata' }, { status: 400 })
  }

  const isFeatured = pricing_tier === 'featured'
  const amount = session.amount_total ?? 0

  const adminClient = createAdminClient()

  // 1. Insert payment record
  const { error: paymentError } = await adminClient.from('payments').insert({
    employer_id,
    job_id,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amount,
    currency: session.currency ?? 'usd',
    payment_status: 'completed',
    pricing_tier,
  })

  if (paymentError) {
    // Check for unique constraint violation (duplicate webhook) — safe to ignore
    if (paymentError.code === '23505') {
      console.warn('Stripe webhook: duplicate event received for session', session.id)
      return NextResponse.json({ received: true, duplicate: true })
    }

    console.error('Stripe webhook: failed to insert payment', paymentError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  // 2. Activate the job
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days

  const { error: jobError } = await adminClient
    .from('jobs')
    .update({
      status: 'active',
      published_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_featured: isFeatured,
    })
    .eq('id', job_id)
    .eq('employer_id', employer_id) // double-check ownership

  if (jobError) {
    console.error('Stripe webhook: failed to activate job', jobError)
    // Payment was recorded — job activation failure is recoverable by admin
    return NextResponse.json({ error: 'Failed to activate job', payment_recorded: true }, { status: 500 })
  }

  console.log(`Stripe webhook: job ${job_id} activated, payment ${session.id} recorded, tier=${pricing_tier}`)

  return NextResponse.json({
    received: true,
    job_id,
    status: 'active',
    pricing_tier,
  })
}

/**
 * Stripe requires the raw body for signature verification.
 * Disable Next.js body parsing for this route.
 */
export const dynamic = 'force-dynamic'
