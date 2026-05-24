'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import type { Job, CandidateProfile } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface ApplyButtonProps {
  job: Job
  candidateProfile: CandidateProfile | null
}

export function ApplyButton({ job, candidateProfile }: ApplyButtonProps) {
  const [showForm, setShowForm] = React.useState(false)
  const [coverNote, setCoverNote] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [applied, setApplied] = React.useState(false)

  const isVerified =
    candidateProfile?.verification_status === 'verified_student' ||
    candidateProfile?.verification_status === 'verified_alumni'

  async function handleApply() {
    if (!candidateProfile || !isVerified) return
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.from('job_applications').insert({
      job_id: job.id,
      candidate_profile_id: candidateProfile.id,
      cover_note: coverNote.trim() || null,
    })

    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already applied', description: 'You have already applied to this job.' })
        setApplied(true)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit application. Please try again.',
          variant: 'destructive',
        })
      }
      return
    }

    setApplied(true)
    setShowForm(false)
    toast({
      title: 'Application submitted!',
      description: 'The employer has been notified of your application.',
    })
  }

  if (applied) {
    return (
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
          ✓ Application submitted
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          You can track your applications in your{' '}
          <Link href="/dashboard/candidate" className="underline underline-offset-4">
            candidate dashboard
          </Link>
          .
        </p>
      </div>
    )
  }

  // Not logged in
  if (!candidateProfile) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="font-medium mb-2">Verified candidates only</p>
        <p className="text-sm text-muted-foreground mb-4">
          You must verify your school email to apply to this job.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/candidates/signup">Get Verified — Free</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/how-verification-works">How it works</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Pending verification
  if (!isVerified) {
    return (
      <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20 p-6">
        <p className="font-medium mb-2">Your account is pending verification</p>
        <p className="text-sm text-muted-foreground mb-4">
          Status: <strong>{candidateProfile.verification_status.replace('_', ' ')}</strong>.
          You&apos;ll be able to apply once your school email is verified.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/candidates/verify">Complete verification</Link>
        </Button>
      </div>
    )
  }

  // Verified — show apply button or form
  return (
    <div>
      {!showForm ? (
        <div className="flex items-center gap-3">
          <Button size="lg" onClick={() => setShowForm(true)}>
            Apply to this job
          </Button>
          <p className="text-xs text-muted-foreground">
            Takes about 30 seconds. Your verified profile is shared with the employer.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-5 space-y-4">
          <div>
            <p className="font-semibold mb-1">Submit your application</p>
            <p className="text-sm text-muted-foreground">
              Your verified candidate profile (name, school, major, LinkedIn) will be shared. Optionally add a short cover note.
            </p>
          </div>
          <div>
            <Label htmlFor="cover-note" className="mb-1.5 block">
              Cover note <span className="text-muted-foreground font-normal">(optional, max 1,000 characters)</span>
            </Label>
            <Textarea
              id="cover-note"
              placeholder="Why are you interested in this role? Any relevant context..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {coverNote.length}/1000
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleApply} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit application'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
