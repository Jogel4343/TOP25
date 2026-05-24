'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OtpInput } from '@/components/otp-input'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

type VerifyState = 'idle' | 'loading' | 'success' | 'error'

export default function CandidateVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const emailFromParams = searchParams.get('email') ?? ''

  const [email, setEmail] = React.useState(emailFromParams)
  const [otp, setOtp] = React.useState('')
  const [state, setState] = React.useState<VerifyState>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [resending, setResending] = React.useState(false)
  const [resendCountdown, setResendCountdown] = React.useState(0)

  // Countdown for resend button
  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((n) => n - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  async function handleVerify() {
    if (otp.length !== 6 || !email) return

    setState('loading')
    setErrorMessage('')

    const supabase = createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: otp,
      type: 'email',
    })

    if (error) {
      setState('error')
      setErrorMessage(
        error.message.includes('expired')
          ? 'This code has expired. Please request a new one.'
          : error.message.includes('invalid')
          ? 'Incorrect code. Please double-check and try again.'
          : 'Verification failed. Please try again.'
      )
      return
    }

    if (data.user) {
      // Call finalize route to upsert candidate profile
      try {
        const response = await fetch('/api/candidates/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          console.error('Finalize failed:', await response.text())
          // Still redirect — user is authenticated, profile might already exist
        }
      } catch (err) {
        console.error('Finalize fetch error:', err)
      }

      setState('success')
      toast({
        title: 'Email verified!',
        description: 'Your school email has been verified. Welcome to Top25 Talent.',
      })

      setTimeout(() => {
        router.push('/dashboard/candidate')
      }, 1500)
    }
  }

  async function handleResend() {
    if (!email || resendCountdown > 0) return

    setResending(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: false },
    })

    setResending(false)

    if (error) {
      toast({
        title: 'Failed to resend',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      })
      return
    }

    setResendCountdown(60)
    setOtp('')
    toast({ title: 'New code sent', description: `Check ${email} for a new 6-digit code.` })
  }

  // Auto-submit when OTP is complete
  React.useEffect(() => {
    if (otp.length === 6 && state === 'idle') {
      handleVerify()
    }
  }, [otp]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Verified!</h1>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground text-sm mt-2">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">
              {email || 'your school email'}
            </span>
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <p className="text-sm text-muted-foreground">
              Enter the code below. It expires in 60 minutes.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Error state */}
            {state === 'error' && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {/* OTP Input */}
            <div className="flex justify-center">
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val)
                  if (state === 'error') setState('idle')
                }}
                disabled={state === 'loading' || state === 'success'}
                error={state === 'error'}
                autoFocus
              />
            </div>

            {/* Submit button */}
            <Button
              className="w-full gap-2"
              onClick={handleVerify}
              disabled={otp.length < 6 || state === 'loading'}
            >
              {state === 'loading' ? 'Verifying...' : 'Verify code'}
              {state === 'idle' && <ArrowRight className="h-4 w-4" />}
            </Button>

            {/* Email input (in case user arrives directly) */}
            {!emailFromParams && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="netid@virginia.edu"
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {/* Resend */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={handleResend}
                disabled={resending || resendCountdown > 0}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resendCountdown > 0
                  ? `Resend in ${resendCountdown}s`
                  : resending
                  ? 'Resending...'
                  : 'Resend code'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Wrong email?{' '}
          <Link href="/candidates/signup" className="underline underline-offset-4">
            Start over
          </Link>
          {' · '}
          <Link href="/how-verification-works" className="underline underline-offset-4">
            How verification works
          </Link>
        </p>
      </div>
    </div>
  )
}
