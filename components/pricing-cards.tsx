import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRICING, type PricingConfig } from '@/lib/stripe'
import type { PricingTier } from '@/lib/supabase/types'

interface PricingCardsProps {
  onSelect?: (tier: PricingTier) => void
  selectedTier?: PricingTier | null
  ctaLabel?: string
  showContactForTeam?: boolean
}

export function PricingCards({
  onSelect,
  selectedTier,
  ctaLabel = 'Get started',
  showContactForTeam = true,
}: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      {Object.values(PRICING).map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          isSelected={selectedTier === plan.id}
          onSelect={onSelect}
          ctaLabel={ctaLabel}
        />
      ))}
    </div>
  )
}

function PricingCard({
  plan,
  isSelected,
  onSelect,
  ctaLabel,
}: {
  plan: PricingConfig
  isSelected: boolean
  onSelect?: (tier: PricingTier) => void
  ctaLabel: string
}) {
  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-200',
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-background'
          : 'border-border hover:border-emerald-200 dark:hover:border-emerald-800',
        plan.isFeatured && 'shadow-md'
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="emerald" className="gap-1">
            {plan.isFeatured && <Star className="h-3 w-3 fill-current" />}
            {plan.badge}
          </Badge>
        </div>
      )}

      <CardHeader className="pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
        </div>
        <div className="mt-2">
          <span className="text-4xl font-bold tracking-tight">{plan.displayPrice}</span>
          <span className="text-muted-foreground ml-1">/ job post</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      {onSelect && (
        <CardFooter>
          <Button
            className="w-full"
            variant={isSelected ? 'default' : plan.isFeatured ? 'default' : 'outline'}
            onClick={() => onSelect(plan.id)}
          >
            {isSelected ? 'Selected' : ctaLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
