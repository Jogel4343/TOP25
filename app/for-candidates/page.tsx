import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Briefcase, Eye, Star, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'For Candidates',
  description:
    'Get verified as a student or alumni and access exclusive job opportunities from top employers who specifically want top-university talent.',
}

const ELIGIBLE_SCHOOLS = [
  { name: 'Harvard University', short: 'Harvard', featured: false },
  { name: 'MIT', short: 'MIT', featured: false },
  { name: 'Stanford University', short: 'Stanford', featured: false },
  { name: 'Princeton University', short: 'Princeton', featured: false },
  { name: 'Yale University', short: 'Yale', featured: false },
  { name: 'Columbia University', short: 'Columbia', featured: false },
  { name: 'University of Pennsylvania', short: 'UPenn', featured: false },
  { name: 'University of Chicago', short: 'UChicago', featured: false },
  { name: 'Duke University', short: 'Duke', featured: false },
  { name: 'University of Virginia', short: 'UVA', featured: true },
  { name: 'UC Berkeley', short: 'UC Berkeley', featured: false },
  { name: 'Northwestern University', short: 'Northwestern', featured: false },
  { name: 'Cornell University', short: 'Cornell', featured: false },
  { name: 'Vanderbilt University', short: 'Vanderbilt', featured: false },
  { name: 'Rice University', short: 'Rice', featured: false },
]

export default function ForCandidatesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border/50 py-16 md:py-24">
        <div className="container max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Your school background,{' '}
            <span className="text-emerald-600 dark:text-emerald-500">
              verified and working for you
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Top25 Talent connects verified students and alumni from elite universities
            directly with employers who specifically want your background. One verification,
            access to all employers on the platform.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link href="/candidates/signup">
              Get Verified — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">
            What you get as a verified candidate
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <BenefitCard
              icon={ShieldCheck}
              title="Verified status badge"
              description="Your profile shows a verified badge (Student or Alumni) that employers can trust. No self-reported credentials."
            />
            <BenefitCard
              icon={Briefcase}
              title="Access to all job listings"
              description="Browse and apply to every active job on the platform. Unverified users cannot apply — your badge sets you apart."
            />
            <BenefitCard
              icon={Eye}
              title="Searchable profile"
              description="Once verified, your profile becomes searchable by employers looking for talent from your school and major."
            />
            <BenefitCard
              icon={Star}
              title="Jobs that want you specifically"
              description="Employers can target specific schools. When you apply, they already know you match their preferred backgrounds."
            />
          </div>
        </div>
      </section>

      {/* Eligible schools */}
      <section className="border-y border-border/50 bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-2">
            Eligible schools
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Currently supporting 15 top-ranked US universities. More added regularly.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {ELIGIBLE_SCHOOLS.map((school) => (
              <span
                key={school.short}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  school.featured
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {school.short}
                {school.featured && ' ★'}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Verification explainer */}
      <section className="py-16">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-3">
            How verification works
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Takes about 2 minutes. No documents required.
          </p>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Enter your school email',
                desc: 'Provide your university-issued email (.edu or recognized alumni domain). We check it against our database of allowed domains for your school.',
              },
              {
                step: '2',
                title: 'Enter the 6-digit OTP',
                desc: 'We send a one-time passcode to your school inbox. Enter it on our verify page within 1 hour. This proves you control the inbox.',
              },
              {
                step: '3',
                title: 'Your profile is activated',
                desc: 'Matching domain + confirmed OTP = verified status. Your profile becomes searchable and you can apply to any job immediately.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/candidates/signup">Start verification</Link>
            </Button>
            <div className="mt-3">
              <Link
                href="/how-verification-works"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Read the full verification guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Alumni section */}
      <section className="border-t border-border/50 bg-muted/30 py-16">
        <div className="container max-w-2xl text-center">
          <GraduationCap className="h-10 w-10 text-emerald-600 dark:text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Already graduated? You&apos;re still eligible.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Alumni with an active alumni email domain (e.g., alumni.harvard.edu) verify
            automatically, just like current students. If your alumni email has expired,
            our admin team reviews your application manually — we verify your degree
            and activate your profile within 24 hours.
          </p>
          <Button variant="outline" asChild>
            <Link href="/how-verification-works#alumni">
              Alumni verification details
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="border">
      <CardContent className="p-6">
        <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-500 mb-3" />
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
