import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from '@/components/mobile-menu'

export async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-semibold tracking-tight text-foreground">
            Top25<span className="text-emerald-600 dark:text-emerald-500">Talent</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/jobs"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse Jobs
          </Link>
          <Link
            href="/for-employers"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            For Employers
          </Link>
          <Link
            href="/for-candidates"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            For Candidates
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>

        {/* CTA + theme */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/candidate">Dashboard</Link>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/employers/signup">Post a Job</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield shape */}
      <path
        d="M14 2L4 6.5V13C4 18.55 8.24 23.74 14 25C19.76 23.74 24 18.55 24 13V6.5L14 2Z"
        className="fill-emerald-600 dark:fill-emerald-500"
      />
      {/* Checkmark */}
      <path
        d="M10 14L12.5 16.5L18 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
