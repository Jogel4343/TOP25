import 'server-only'
import Stripe from 'stripe'

// Re-export pricing data for server-side convenience.
// Client components should import from '@/lib/pricing' directly.
export { PRICING, getPricingConfig } from '@/lib/pricing'
export type { PricingConfig } from '@/lib/pricing'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})
