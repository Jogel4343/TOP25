'use client'

import * as React from 'react'
import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { candidateSignupAction, type SignupActionState } from './actions'
import { createClient } from '@/lib/supabase/client'
import type { School } from '@/lib/supabase/types'

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 2 + i)

const initialState: SignupActionState = { success: false }

export default function CandidateSignupPage() {
  const [state, formAction] = useFormState(candidateSignupAction, initialState)
  const [schools, setSchools] = React.useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = React.useState('')
  const [selectedYear, setSelectedYear] = React.useState('')
  const router = useRouter()

  // Load schools from Supabase
  React.useEffect(() => {
    const supabase = createClient()
    supabase
      .from('schools')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setSchools(data ?? []))
  }, [])

  // Redirect to verify page on success
  React.useEffect(() => {
    if (state.success && state.email) {
      router.push(`/candidates/verify?email=${encodeURIComponent(state.email)}`)
    }
  }, [state, router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verify your school email</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Already have an account?{' '}
            <Link href="/candidates/verify" className="text-emerald-600 hover:underline underline-offset-4">
              Enter your OTP
            </Link>
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll verify your school affiliation by sending a 6-digit code to your university email.
            </p>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {/* Global error */}
              {state.error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {state.error}
                </div>
              )}

              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Jordan Blackwell"
                  required
                  autoComplete="name"
                />
                {state.fieldErrors?.full_name && (
                  <p className="text-xs text-destructive">{state.fieldErrors.full_name[0]}</p>
                )}
              </div>

              {/* School */}
              <div className="space-y-1.5">
                <Label htmlFor="school_id">School</Label>
                <Select
                  name="school_id"
                  value={selectedSchool}
                  onValueChange={setSelectedSchool}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.fieldErrors?.school_id && (
                  <p className="text-xs text-destructive">{state.fieldErrors.school_id[0]}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">School email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="netid@virginia.edu"
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">
                  Must be a university-issued email (.edu or recognized alumni domain)
                </p>
                {state.fieldErrors?.email && (
                  <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Graduation year */}
              <div className="space-y-1.5">
                <Label htmlFor="graduation_year">Graduation year</Label>
                <Select
                  name="graduation_year"
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAD_YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                        {year === CURRENT_YEAR ? ' (current)' : ''}
                        {year === CURRENT_YEAR + 1 ? ' (upcoming)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.fieldErrors?.graduation_year && (
                  <p className="text-xs text-destructive">{state.fieldErrors.graduation_year[0]}</p>
                )}
              </div>

              {/* Major */}
              <div className="space-y-1.5">
                <Label htmlFor="major">Major / field of study</Label>
                <Input
                  id="major"
                  name="major"
                  placeholder="Economics"
                  required
                />
                {state.fieldErrors?.major && (
                  <p className="text-xs text-destructive">{state.fieldErrors.major[0]}</p>
                )}
              </div>

              {/* LinkedIn (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="linkedin_url">
                  LinkedIn URL{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  autoComplete="url"
                />
                {state.fieldErrors?.linkedin_url && (
                  <p className="text-xs text-destructive">{state.fieldErrors.linkedin_url[0]}</p>
                )}
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By signing up, you agree that your school email may be verified.{' '}
          <Link href="/how-verification-works" className="underline underline-offset-4">
            How verification works
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
      {pending ? 'Sending code...' : 'Send verification code'}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  )
}
