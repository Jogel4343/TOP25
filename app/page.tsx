import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, GraduationCap, Building2, Search, Zap, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/job-card'

export const metadata: Metadata = {
  title: 'Top25 Talent — Verified Students & Alumni from Top Universities',
  description:
    'The recruiting marketplace for verified students and alumni from the top 25 US universities. Every candidate is verified by their school email.',
}

const SCHOOLS_DISPLAYED = [
  'Harvard', 'MIT', 'Stanford', 'Princeton', 'Yale',
  'Columbia', 'UPenn', 'UChicago', 'UVA', 'Duke',
]

export default async function HomePage() {
  const supabase = createClient()

  // Fetch 3 featured active jobs for social proof
  const { data: featuredJobs } = await supabase
    .from('jobs')
    .select(`
      *,
      employer:employer_profiles(company_name, logo_url)
    `)
    .eq('status', 'active')
    .eq('is_featured', true)
    .gt('expires_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <div>
      {/* ============================================================
          HERO
      ============================================================ */}
      <section className="relative overflow-hidden bg-background">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="container relative pt-20 pb-16 md:pt-28 md:pb-24">
          {/* Pre-headline badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="emerald" className="gap-1.5 text-xs px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              School-email verified candidates only
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
            Hire verified talent from{' '}
            <span className="text-emerald-600 dark:text-emerald-500">
              top-25 universities
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-center text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every candidate on Top25 Talent is verified by their university email address.
            No resume spam. No unqualified applicants. Just elite students and alumni
            who are ready to work.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/employers/signup">
                Post a Job
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/candidates/signup">
                Get Verified as a Candidate
              </Link>
            </Button>
          </div>

          {/* School logos */}
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
              Verified students and alumni from
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {SCHOOLS_DISPLAYED.map((school) => (
                <span
                  key={school}
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    school === 'UVA'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'text-muted-foreground'
                  }`}
                >
                  {school}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}
      <section className="border-y border-border/50 bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-center text-2xl font-bold tracking-tight mb-2">
            How it works
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            From sign-up to hire in minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowItWorksStep
              number="01"
              icon={GraduationCap}
              title="Candidates verify with school email"
              description="Students enter their .edu email. We match it against our allowed-domains database and send a 6-digit OTP. School affiliation is proven before the OTP is even sent."
            />
            <HowItWorksStep
              number="02"
              icon={Search}
              title="Employers post targeted jobs"
              description="Post an internship or full-time role in minutes. Target specific universities, role types, and locations. Pay once, list for 30 days."
            />
            <HowItWorksStep
              number="03"
              icon={Zap}
              title="Qualified applicants, fast"
              description="Only verified candidates can apply. Review applications in your employer dashboard. Every applicant has confirmed their school affiliation."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED JOBS
      ============================================================ */}
      {featuredJobs && featuredJobs.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Featured opportunities</h2>
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/jobs">
                  View all jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {featuredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={{
                    ...job,
                    employer: job.employer
                      ? {
                          company_name: (job.employer as { company_name: string }).company_name,
                          logo_url: (job.employer as { logo_url?: string | null }).logo_url,
                        }
                      : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          TRUST SECTION — verification explained
      ============================================================ */}
      <section className="border-y border-border/50 bg-muted/30 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-3">
              Verification that actually means something
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Candidates don&apos;t self-report their school. They verify with their school-issued
              email address before they can view or apply to any job. Current students use their
              active .edu inbox. Alumni verify with designated alumni email domains.
              Our admin team reviews edge cases manually.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <TrustPill label="School-email OTP" description="6-digit code to .edu inbox" />
              <TrustPill label="Alumni domain match" description="Recognized alumni email domains" />
              <TrustPill label="Manual review fallback" description="Admin-verified for edge cases" />
            </div>
            <Button variant="outline" className="mt-8" asChild>
              <Link href="/how-verification-works">
                Read how verification works
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR EMPLOYERS CTA
      ============================================================ */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-3">
              Ready to reach the best candidates?
            </h2>
            <p className="text-muted-foreground mb-6">
              Post a job starting at $60. No subscriptions. No contracts. Just verified talent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/employers/signup">Post a Job — from $60</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/for-employers">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function HowItWorksStep({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-mono font-semibold text-muted-foreground">{number}</span>
        <div className="h-px flex-1 bg-border" />
        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function TrustPill({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-background">
      <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-500 mb-2" />
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-xs text-muted-foreground mt-1">{description}</span>
    </div>
  )
}
