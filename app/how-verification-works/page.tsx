import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Mail, CheckCircle, UserCheck, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'How Verification Works',
  description:
    'Learn how Top25 Talent verifies students and alumni through school email OTP verification. The most rigorous candidate verification in campus recruiting.',
}

export default function HowVerificationWorksPage() {
  return (
    <div className="py-16">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            How verification works
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Every candidate on Top25 Talent has proven their school affiliation through a
            two-part verification: domain matching and email OTP. Here&apos;s exactly how it works.
          </p>
        </div>

        {/* The two-part process */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">The two-part verification</h2>

          <div className="space-y-4">
            <div className="flex gap-4 p-5 rounded-lg border bg-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Part 1: Domain matching (proves school affiliation)</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Before we send any email, we check the submitted email domain against our
                  database of allowed domains for each school. A{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">virginia.edu</code> address
                  proves UVA affiliation. An{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">wharton.upenn.edu</code>{' '}
                  address proves UPenn/Wharton affiliation.
                  <strong className="text-foreground"> The domain match is the school proof.</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-lg border bg-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Mail className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Part 2: Email OTP (proves inbox ownership)</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We send a 6-digit one-time passcode to the submitted email address. Entering it
                  correctly within 60 minutes proves you control that inbox. The OTP does not
                  prove school affiliation on its own — that&apos;s what the domain check does.
                  <strong className="text-foreground"> Together, they prove you own a school-issued inbox.</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Verification paths */}
        <section className="mb-12" id="paths">
          <h2 className="text-xl font-bold tracking-tight mb-6">Verification paths</h2>

          <div className="space-y-4">
            {/* Auto-verify student */}
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800">
                <Badge variant="emerald" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Student
                </Badge>
                <span className="text-sm font-medium">Auto-verified</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Email domain matches an active student domain with{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">auto_verify=true</code>.
                  After OTP confirmation, status immediately becomes{' '}
                  <strong>verified_student</strong>. Profile is made searchable instantly.
                  Example: <code className="text-xs bg-muted px-1 py-0.5 rounded">netid@virginia.edu</code>
                </p>
              </div>
            </div>

            {/* Auto-verify alumni */}
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800">
                <Badge variant="emerald" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Alumni
                </Badge>
                <span className="text-sm font-medium">Auto-verified</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Email domain matches an active alumni domain with{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">auto_verify=true</code>.
                  After OTP confirmation, status becomes <strong>verified_alumni</strong>.
                  Example: <code className="text-xs bg-muted px-1 py-0.5 rounded">name@alumni.harvard.edu</code>
                </p>
              </div>
            </div>

            {/* Manual review */}
            <div className="rounded-lg border overflow-hidden" id="alumni">
              <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-800">
                <Badge variant="yellow" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Manual Review
                </Badge>
                <span className="text-sm font-medium">Reviewed within 24 hours</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Two cases lead to manual review: (1) An alumni domain with{' '}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">auto_verify=false</code>,
                  meaning our admin team reviews the email ownership before granting alumni status.
                  (2) An unknown domain (e.g., a school email format we don&apos;t recognize yet) — we
                  still send an OTP to confirm inbox ownership, then an admin verifies school
                  affiliation before approving.
                </p>
              </div>
            </div>

            {/* Blocked */}
            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
                <Badge variant="red" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Not Eligible
                </Badge>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If the email domain is from a school not in our eligible list, or if the domain
                  is explicitly marked inactive (e.g., a school we&apos;ve removed), no OTP is sent
                  and no account is created. The event is logged for monitoring.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security notes */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-4">Security design</h2>
          <ul className="space-y-3">
            {[
              'Domain matching runs server-side before the OTP is sent — it cannot be bypassed by client-side manipulation.',
              'OTP codes expire after 60 minutes and are single-use.',
              'Verification status (verified_student, verified_alumni, etc.) is set by the server after OTP confirmation, never by the client.',
              'Searchability (is_searchable) is set to true only by the server after a successful OTP verify, for verified statuses.',
              'Database-level Row Level Security (RLS) ensures unverified profiles are never returned in employer queries, regardless of app code.',
              'All verification events are logged to an audit table for monitoring and dispute resolution.',
            ].map((note, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="text-center border-t border-border/50 pt-10">
          <h2 className="text-xl font-bold tracking-tight mb-2">Ready to verify?</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Verification takes about 2 minutes. Start with your school email.
          </p>
          <Button asChild>
            <Link href="/candidates/signup">Get verified — it&apos;s free</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
