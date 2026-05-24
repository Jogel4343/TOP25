'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'

interface MobileMenuProps {
  user: User | null
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b bg-background px-4 py-6 shadow-lg">
          <nav className="flex flex-col gap-4 text-sm">
            <Link
              href="/jobs"
              className="py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Browse Jobs
            </Link>
            <Link
              href="/for-employers"
              className="py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              For Employers
            </Link>
            <Link
              href="/for-candidates"
              className="py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              For Candidates
            </Link>
            <Link
              href="/pricing"
              className="py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/how-verification-works"
              className="py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              How Verification Works
            </Link>

            <div className="mt-2 flex flex-col gap-2 border-t pt-4">
              {user ? (
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/dashboard/candidate">My Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild onClick={() => setOpen(false)}>
                    <Link href="/candidates/signup">Candidate Sign In</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/employers/signup">Post a Job</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
