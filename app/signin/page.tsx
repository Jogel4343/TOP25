'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

type State = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Universal sign-in page for existing users (candidates and employers).
 *
 * Flow:
 *   1. User enters email
 *   2. We call signInWithOtp with shouldCreateUser: false
 *   3. If the email exists, Supabase emails a fresh 6-digit code
 *   4. Redirect to the appropriate verify page based on the user's intent
 *      (we don't know intent at sign-in time, so we look it up via API)
 *
 * If the email doesn't exist, we show a friendly message pointing to signup.
 */
export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') ?? ''

  const [email, setEmail] = React.useState(emailFromUrl)
  const [state, setState] = React.useState<State>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setState('sending')
    setErrorMessage('')

    const cleanedEmail = email.toLowerCase().trim()

    // Ask the server which kind of account this email has (candidate vs employer)
    // so we can route to the right verify page after the code is sent.
    let intent: 'candidate' | 'employer' | 'unknown' = 'unknown'
    try {
      const lookupResponse = await fetch('/api/auth/lookup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanedEmail }),
      })
      if (lookupResponse.ok) {
        const data = await lookupResponse.json()
        intent = data.intent ?? 'unknown'
      }
    } catch {
      // Non-fatal — fall through to OTP send
    }

    if (intent === 'unknown') {
      setState('error')
      setErrorMessage(
        "We couldn't find an account with that email. Please sign up first."
      )
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanedEmail,
      options: { shouldCreateUser: false },
    })

    if (error) {
      setState('error')
      setErrorMessage(
        error.message.includes('rate')
          ? 'Too many requests. Please wait a few minutes and try again.'
          : 'Failed to send code. Please try again in a moment.'
      )
      return
    }

    setState('sent')
    toast({
      title: 'Code sent',
      description: `Check ${cleanedEmail} for a 6-digit code.`,
    })

    // Route to the matching verify page
    const verifyPath =
      intent === 'employer' ? '/employers/verify' : '/candidates/verify'
    setTimeout(() => {
      router.push(`${verifyPath}?email=${encodeURIComponent(cleanedEmail)}`)
    }, 800)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm mt-2">
            We'll email you a 6-digit code to sign in.
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <p className="text-sm text-muted-foreground">
              Enter the email you signed up with.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {state === 'error' && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <div>
                <label
                  htmlFor="signin-email"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === 'error') setState('idle')
                  }}
                  placeholder="you@school.edu"
                  required
                  disabled={state === 'sending' || state === 'sent'}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={!email || state === 'sending' || state === 'sent'}
              >
                {state === 'sending'
                  ? 'Sending...'
                  : state === 'sent'
                  ? 'Code sent! Redirecting...'
                  : 'Send code'}
                {state === 'idle' && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link
            href="/candidates/signup"
            className="underline underline-offset-4"
          >
            Sign up as a candidate
          </Link>
          {' · '}
          <Link
            href="/employers/signup"
            className="underline underline-offset-4"
          >
            Sign up as an employer
          </Link>
        </p>
      </div>
    </div>
  )
}
