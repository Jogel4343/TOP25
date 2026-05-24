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

export default function EmployerVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const emailFromParams = searchParams.get('email') ?? ''

  const [email, setEmail] = React.useState(emailFromParams)
  const [otp, setOtp] = React.useState('')
  const [state, setState] = React.useState<VerifyState>('idle')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [resendCountdown, setResendCountdown] = React.useState(0)
  const [resending, setResending] = React.useState(false)

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
          : 'Incorrect code. Please check and try again.'
      )
      return
    }

    if (data.user) {
      // Create employer profile
      const meta = data.user.user_metadata as {
        intent?: string
        company_name?: string
        website_url?: string | null
        work_email?: string
      }

      if (meta.intent === 'employer') {
        const supabase2 = createClient()
        await supabase2.from('employer_profiles').upsert(
          {
            auth_user_id: data.user.id,
            company_name: meta.company_name ?? 'My Company',
            work_email: data.user.email ?? meta.work_email ?? '',
            website_url: meta.website_url ?? null,
          },
          { onConflict: 'auth_user_id', ignoreDuplicates: false }
        )
      }

      setState('success')
      toast({ title: 'Signed in!', description: 'Redirecting to your dashboard.' })
      setTimeout(() => router.push('/dashboard/employer'), 1200)
    }
  }

  async function handleResend() {
    if (!email || resendCountdown > 0) return
    setResending(true)

    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: false },
    })

    setResending(false)
    setResendCountdown(60)
    setOtp('')
    toast({ title: 'Code resent', description: `Check ${email}.` })
  }

  React.useEffect(() => {
    if (otp.length === 6 && state === 'idle') handleVerify()
  }, [otp]) // eslint-disable-line

  if (state === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Signed in!</h1>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-foreground">{email || 'your email'}</span>
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <p className="text-sm text-muted-foreground">Code expires in 60 minutes.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {state === 'error' && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-center">
              <OtpInput
                value={otp}
                onChange={(v) => { setOtp(v); if (state === 'error') setState('idle') }}
                disabled={state === 'loading'}
                error={state === 'error'}
                autoFocus
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleVerify}
              disabled={otp.length < 6 || state === 'loading'}
            >
              {state === 'loading' ? 'Verifying...' : 'Verify & continue'}
              {state === 'idle' && <ArrowRight className="h-4 w-4" />}
            </Button>

            {!emailFromParams && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="work@company.com"
                className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={handleResend}
                disabled={resending || resendCountdown > 0}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/employers/signup" className="underline underline-offset-4">
            Start over
          </Link>
        </p>
      </div>
    </div>
  )
}
