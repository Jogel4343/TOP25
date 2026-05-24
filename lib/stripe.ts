import 'server-only'
import Stripe from 'stripe'
import type { PricingTier } from '@/lib/supabase/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// ============================================================
// Pricing configuration
// ============================================================

export interface PricingConfig {
  id: PricingTier
  name: string
  price: number // in cents
  displayPrice: string
  description: string
  features: string[]
  isFeatured: boolean
  badge?: string
}

export const PRICING: Record<PricingTier, PricingConfig> = {
  founding: {
    id: 'founding',
    name: 'Founding Post',
    price: 6000, // $60
    displayPrice: '$60',
    description: 'Post one job for 30 days to our verified student and alumni network.',
    features: [
      '30-day active listing',
      'Visible to all verified candidates',
      'Filter by school, role type, and location',
      'Direct apply button with cover note',
      'Applicant tracking dashboard',
    ],
    isFeatured: false,
    badge: 'Best value for early-stage',
  },
  featured: {
    id: 'featured',
    name: 'Featured Post',
    price: 9900, // $99
    displayPrice: '$99',
    description: 'Everything in Founding Post, plus top placement on the jobs board.',
    features: [
      'Everything in Founding Post',
      'Pinned to top of jobs board for 30 days',
      'Featured badge on listing',
      'Priority in school-filtered searches',
      'Highlighted in email digests (coming soon)',
    ],
    isFeatured: true,
    badge: 'Most visibility',
  },
}

export function getPricingConfig(tier: PricingTier): PricingConfig {
  return PRICING[tier]
}
