import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Target, Shield, Clock, BarChart, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'For Employers',
  description:
    'Hire verified students and alumni from the top 25 US universities. Post internships and full-time roles directly to elite, pre-verified candidates.',
}

const BENEFITS = [
  {
    icon: Shield,
    title: 'Every candidate is verified',
    description:
      'No self-reported credentials. Every candidate has proven their school affiliation with their university email address before they can even browse jobs.',
  },
  {
    icon: Target,
    title: 'Target specific universities',
    description:
      'Post to all 15+ eligible schools, or narrow your job to specific programs — business schools, CS departments, or liberal arts colleges.',
  },
  {
    icon: Clock,
    title: 'Post in under 5 minutes',
    description:
      'No sales calls, no contracts, no minimums. Write your job description, choose your tier, and pay with a card. You\'re live in minutes.',
  },
  {
    icon: BarChart,
    title: 'Applicant tracking included',
    description:
      'Your employer dashboard shows every applicant, their verification status, and their profile. Mark applications viewed, advanced, or rejected.',
  },
  {
    icon: Users,
    title: 'Reach students before graduation',
    description:
      'Source interns and new grads directly, before LinkedIn algorithm makes them impossible to find. Build your pipeline early.',
  },
  {
    icon: CheckCircle,
    title: 'Flat-rate pricing',
    description:
      'Founding Post at $60, Featured Post at $99. One-time payment. No monthly fees. Job expires after 30 days — renew with one click.',
  },
]

export default function ForEmployersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border/50 py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Hire the best students in the country —{' '}
              <span className="text-emerald-600 dark:text-emerald-500">
                verified
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Top25 Talent connects you directly with verified students and alumni from
              Harvard, MIT, Stanford, UVA, and 11 other top universities. Every candidate
              has confirmed their school affiliation. No resume spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="gap-2">
                <Link href="/employers/signup">
                  Post a Job
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2">
            Why post on Top25 Talent
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            Built for companies that care about where their candidates come from.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <Card key={b.title} className="border">
                <CardContent className="p-6">
                  <b.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-500 mb-3" />
                  <h3 className="font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who's hiring */}
      <section className="border-y border-border/50 bg-muted/30 py-16">
        <div className="container max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Who hires on Top25 Talent
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We are purpose-built for organizations that hire from the top of the GPA distribution —
            investment banks, venture capital firms, consulting firms, tech companies, startups,
            hedge funds, and public sector organizations.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-sm mx-auto">
            {[
              'Venture capital firms running scout programs',
              'Investment banks sourcing analyst classes',
              'Early-stage startups competing for top engineering talent',
              'Consulting firms recruiting before on-campus season',
              'Research organizations and think tanks',
              'Asset managers and hedge funds',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Ready to start hiring?
          </h2>
          <p className="text-muted-foreground mb-6">
            Post your first job in minutes. No demo required.
          </p>
          <Button size="lg" asChild>
            <Link href="/employers/signup">Post a Job — from $60</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
