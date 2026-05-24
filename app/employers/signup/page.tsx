'use client'

import * as React from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { employerSignupAction, type EmployerSignupState } from './actions'

const initialState: EmployerSignupState = { success: false }

export default function EmployerSignupPage() {
  const [state, formAction] = useFormState(employerSignupAction, initialState)
  const router = useRouter()

  React.useEffect(() => {
    if (state.success && state.email) {
      router.push(`/employers/verify?email=${encodeURIComponent(state.email)}`)
    }
  }, [state, router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Building2 className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Post a job</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Create your employer account to start posting jobs to verified university candidates.
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a verification code to your work email.
            </p>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state.error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Anthropic"
                  required
                />
                {state.fieldErrors?.company_name && (
                  <p className="text-xs text-destructive">{state.fieldErrors.company_name[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="work_email">Work email</Label>
                <Input
                  id="work_email"
                  name="work_email"
                  type="email"
                  placeholder="recruiting@company.com"
                  required
                />
                {state.fieldErrors?.work_email && (
                  <p className="text-xs text-destructive">{state.fieldErrors.work_email[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website_url">
                  Company website{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="url"
                  placeholder="https://yourcompany.com"
                />
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/employers/verify" className="underline underline-offset-4">
            Sign in
          </Link>
          {' · '}
          <Link href="/pricing" className="underline underline-offset-4">
            View pricing
          </Link>
        </p>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? 'Sending code...' : 'Continue'}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  )
}
