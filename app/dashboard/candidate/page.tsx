import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Upload, Bookmark, FileText, Edit, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { VerificationBadge } from '@/components/verification-badge'
import { createClient } from '@/lib/supabase/server'
import { getCandidateProfile, getUser } from '@/lib/auth'
import { formatDate, roleTypeLabel, workplaceLabel } from '@/lib/utils'
import { ResumeUpload } from './resume-upload'
import { EditProfileForm } from './edit-profile-form'

export const metadata: Metadata = { title: 'Candidate Dashboard' }

export default async function CandidateDashboardPage() {
  const user = await getUser()
  if (!user) redirect('/candidates/signup')

  const profile = await getCandidateProfile()
  if (!profile) redirect('/candidates/signup')

  const supabase = createClient()

  // Fetch saved jobs
  const { data: savedJobs } = await supabase
    .from('saved_jobs')
    .select(`
      id,
      created_at,
      job:jobs(id, title, slug, role_type, workplace_type, employer:employer_profiles(company_name))
    `)
    .eq('candidate_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch applications
  const { data: applications } = await supabase
    .from('job_applications')
    .select(`
      id,
      status,
      created_at,
      job:jobs(id, title, slug, role_type, employer:employer_profiles(company_name))
    `)
    .eq('candidate_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch school name
  const { data: school } = profile.school_id
    ? await supabase.from('schools').select('name, short_name').eq('id', profile.school_id).single()
    : { data: null }

  const isVerified =
    profile.verification_status === 'verified_student' ||
    profile.verification_status === 'verified_alumni'

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-3xl">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {school && (
                  <span className="text-sm text-muted-foreground">{school.name}</span>
                )}
                {profile.graduation_year && (
                  <span className="text-sm text-muted-foreground">· Class of {profile.graduation_year}</span>
                )}
                {profile.major && (
                  <span className="text-sm text-muted-foreground">· {profile.major}</span>
                )}
              </div>
              <div className="mt-2">
                <VerificationBadge status={profile.verification_status} />
              </div>
            </div>
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Pending verification notice */}
        {!isVerified && profile.verification_status === 'verification_sent' && (
          <div className="mb-6 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20 p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              Check your email
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We sent a 6-digit code to your school email.{' '}
              <Link href="/candidates/verify" className="underline underline-offset-4">
                Enter it here
              </Link>
            </p>
          </div>
        )}

        {!isVerified && profile.verification_status === 'manual_review' && (
          <div className="mb-6 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20 p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              Your profile is under review
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Our team is verifying your school affiliation. This typically takes less than 24 hours.
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Profile
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <EditProfileForm profile={profile} />
            </CardContent>
          </Card>

          {/* Resume */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Resume
              </h2>
            </CardHeader>
            <CardContent>
              <ResumeUpload profile={profile} userId={user.id} />
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Applications
                {applications && applications.length > 0 && (
                  <Badge variant="secondary">{applications.length}</Badge>
                )}
              </h2>
            </CardHeader>
            <CardContent>
              {!applications || applications.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No applications yet.</p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/jobs">Browse jobs</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const job = app.job as { id: string; title: string; slug: string; role_type: string; employer: { company_name: string } | null } | null
                    return (
                      <div key={app.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/jobs/${job?.slug ?? ''}`}
                            className="font-medium text-sm hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors truncate block"
                          >
                            {job?.title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(job?.employer as { company_name: string } | null)?.company_name} · {roleTypeLabel(job?.role_type ?? '')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {formatDate(app.created_at)}
                          </p>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Jobs
              </h2>
            </CardHeader>
            <CardContent>
              {!savedJobs || savedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved jobs yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {savedJobs.map((saved) => {
                    const job = saved.job as { id: string; title: string; slug: string; workplace_type: string; employer: { company_name: string } | null } | null
                    return (
                      <div key={saved.id}>
                        <Link
                          href={`/jobs/${job?.slug ?? ''}`}
                          className="font-medium text-sm hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors block"
                        >
                          {job?.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {(job?.employer as { company_name: string } | null)?.company_name} · {workplaceLabel(job?.workplace_type ?? '')}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'secondary' | 'emerald' | 'red' | 'yellow' }> = {
    submitted: { label: 'Submitted', variant: 'secondary' },
    viewed: { label: 'Viewed', variant: 'secondary' },
    advanced: { label: 'Advanced', variant: 'emerald' },
    rejected: { label: 'Not selected', variant: 'red' },
  }
  const c = config[status] ?? config.submitted
  return <Badge variant={c.variant}>{c.label}</Badge>
}
