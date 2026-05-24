import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PRICING } from '@/lib/stripe'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, flat-rate pricing. Post jobs starting at $60. No subscriptions.',
}

const FAQ = [
  {
    q: 'How long does a job listing stay live?',
    a: 'Every job listing is active for 30 days from the moment payment is confirmed. You can renew an expired listing with one click using the same Stripe checkout flow.',
  },
  {
    q: 'What\'s the difference between Founding Post and Featured Post?',
    a: 'Both post types are identical in terms of visibility to all verified candidates. The Featured Post adds a "Featured" badge and pins your job to the top of the jobs board above non-featured listings. If you want maximum applicant volume, choose Featured.',
  },
  {
    q: 'Can I edit a job after it\'s published?',
    a: 'Currently, job descriptions and details cannot be edited after payment to prevent bait-and-switch. Contact us if you need a change — we\'ll handle it manually.',
  },
  {
    q: 'What is the Team Pack?',
    a: 'The Team Pack is a bulk posting option designed for companies that hire multiple roles simultaneously or run semester-long campus recruiting programs. Contact us at team@top25talent.com to discuss volume pricing.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If your job was not approved or activated due to a platform error, we issue a full refund. Jobs that go live are not refundable — the listing cost is for access to the candidate network, not for number of applications.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'We accept all major credit and debit cards through Stripe. Apple Pay and Google Pay are also supported in compatible browsers.',
  },
]

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border/50 py-16">
        <div className="container max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            No subscriptions. No per-applicant fees. Post a job, pay once, get verified candidates.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Founding Post */}
            <PricingCard
              name={PRICING.founding.name}
              price={PRICING.founding.displayPrice}
              description={PRICING.founding.description}
              features={PRICING.founding.features}
              ctaLabel="Post a Job"
              ctaHref="/employers/signup"
              highlight={false}
            />

            {/* Featured Post */}
            <PricingCard
              name={PRICING.featured.name}
              price={PRICING.featured.displayPrice}
              description={PRICING.featured.description}
              features={PRICING.featured.features}
              ctaLabel="Post Featured Job"
              ctaHref="/employers/signup"
              highlight={true}
              badge="Most visibility"
            />

            {/* Team Pack */}
            <Card className="flex flex-col border">
              <CardHeader className="pt-8">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold">Team Pack</h3>
                  <Badge variant="outline">Coming soon</Badge>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold tracking-tight text-muted-foreground">
                    Custom
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For teams posting 5+ roles per semester or running structured campus recruiting programs.
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {[
                    'All Featured Post features',
                    'Bulk posting discount',
                    'Dedicated account manager',
                    'Candidate pipeline reporting',
                    'Custom target school packages',
                    'Semester-long campaign options',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href="mailto:team@top25talent.com">
                    <MessageSquare className="h-4 w-4" />
                    Contact us
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 py-16 bg-muted/30">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container max-w-xl text-center">
          <h2 className="text-xl font-bold tracking-tight mb-3">Ready to post?</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Create your employer account and post your first job in under 5 minutes.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link href="/employers/signup">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function PricingCard({
  name,
  price,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlight,
  badge,
}: {
  name: string
  price: string
  description: string
  features: string[]
  ctaLabel: string
  ctaHref: string
  highlight: boolean
  badge?: string
}) {
  return (
    <Card
      className={`relative flex flex-col ${
        highlight
          ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-background'
          : 'border'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="emerald">{badge}</Badge>
        </div>
      )}
      <CardHeader className="pt-8">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="mt-2">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          <span className="text-muted-foreground ml-1 text-sm">/ job post</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={highlight ? 'default' : 'outline'} asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
