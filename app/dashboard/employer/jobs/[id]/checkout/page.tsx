'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PricingCards } from '@/components/pricing-cards'
import { toast } from '@/components/ui/use-toast'
import type { PricingTier } from '@/lib/supabase/types'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [selectedTier, setSelectedTier] = React.useState<PricingTier | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function handleCheckout() {
    if (!selectedTier) return

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, pricing_tier: selectedTier }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error ?? 'Checkout failed')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setLoading(false)
      toast({
        title: 'Checkout error',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Choose your plan</h1>
          <p className="text-muted-foreground">
            Your job listing will go live immediately after payment. No subscriptions — one-time fee.
          </p>
        </div>

        <PricingCards
          onSelect={setSelectedTier}
          selectedTier={selectedTier}
          ctaLabel="Select"
        />

        {selectedTier && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="gap-2 min-w-[200px]"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Redirecting to Stripe...' : 'Continue to payment'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <Card className="mt-6 border bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              Payments processed securely by Stripe. Your job goes live within seconds of payment confirmation.
              All major credit and debit cards accepted.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
