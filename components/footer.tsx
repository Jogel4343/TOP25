import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="font-semibold tracking-tight">
                Top25<span className="text-emerald-600 dark:text-emerald-500">Talent</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The recruiting marketplace for verified students and alumni from the top 25 US
              universities.
            </p>
          </div>

          {/* For Job Seekers */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Candidates</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/for-candidates" className="hover:text-foreground transition-colors">
                  Why Top25 Talent
                </Link>
              </li>
              <li>
                <Link href="/candidates/signup" className="hover:text-foreground transition-colors">
                  Get Verified
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-foreground transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/how-verification-works"
                  className="hover:text-foreground transition-colors"
                >
                  How Verification Works
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Employers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/for-employers" className="hover:text-foreground transition-colors">
                  Why Hire Here
                </Link>
              </li>
              <li>
                <Link href="/employers/signup" className="hover:text-foreground transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/how-verification-works" className="hover:text-foreground transition-colors">
                  Our Verification Process
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} Top25 Talent. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for the best talent, anywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}
