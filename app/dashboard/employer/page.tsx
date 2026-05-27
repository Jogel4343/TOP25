import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Clock, CheckCircle, XCircle, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEmployerProfile, getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, roleTypeLabel, workplaceLabel, daysUntil } from '@/lib/utils'
import type { Job } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Employer Dashboard' }

/**
 * Self-heal: if an authenticated employer-intent user reaches the dashboard
 * without an employer_profile, create it from their user_metadata.
 */
async function ensureEmployerProfile(userId: string) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('employer_profiles')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle()
  if (existing) return true

  const { data: userResp } = await admin.auth.admin.getUserById(userId)
  const authUser = userResp?.user
  if (!authUser) return false

  const meta = (authUser.user_metadata ?? {}) as {
    intent?: string
    company_name?: string
    website_url?: string | null
    work_email?: string
  }
  if (meta.intent !== 'employer') return false

  const { error } = await admin.from('employer_profiles').upsert(
    {
      auth_user_id: userId,
      company_name: meta.company_name ?? 'My Company',
      work_email: authUser.email ?? meta.work_email ?? '',
      website_url: meta.website_url ?? null,
    },
    { onConflict: 'auth_user_id' }
  )
  if (error) {
    console.error('Self-heal employer profile failed:', error)
    return false
  }
  return true
}

export default async function EmployerDashboardPage() {
  const user = await getUser()
  if (!user) redirect('/employers/signup')

  let profile = await getEmployerProfile()
  if (!profile) {
    const healed = await ensureEmployerProfile(user.id)
    if (healed) profile = await getEmployerProfile()
    if (!profile) redirect('/employers/signup')
  }

  const supabase = createClient()

  // Fetch all employer jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', profile.id)
    .order('created_at', { ascending: false })

  const activeJobs = (jobs ?? []).filter((j) => j.status === 'active')
  const pendingJobs = (jobs ?? []).filter((j) => j.status === 'pending_payment' || j.status === 'draft')
  const expiredJobs = (jobs ?? []).filter((j) => j.status === 'expired' || j.status === 'archived')

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{profile.company_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{profile.work_email}</p>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link href="/dashboard/employer/jobs/new">
              <Plus className="h-4 w-4" />
              Post a job
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active jobs" value={activeJobs.length} icon={CheckCircle} />
          <StatCard label="Pending payment" value={pendingJobs.length} icon={Clock} />
          <StatCard
            label="Total applicants"
            value={(jobs ?? []).reduce((sum, j) => sum + j.applicant_count, 0)}
            icon={Users}
          />
          <StatCard label="Expired" value={expiredJobs.length} icon={XCircle} />
        </div>

        {/* Active jobs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            Active listings
          </h2>
          {activeJobs.length === 0 ? (
            <EmptyState message="No active jobs. Post one to start receiving applications." />
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => <JobRow key={job.id} job={job} />)}
            </div>
          )}
        </section>

        {/* Pending */}
        {pendingJobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-yellow-600" />
              Pending payment
            </h2>
            <div className="space-y-3">
              {pendingJobs.map((job) => <JobRow key={job.id} job={job} />)}
            </div>
          </section>
        )}

        {/* Expired */}
        {expiredJobs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              Expired / Archived
            </h2>
            <div className="space-y-3">
              {expiredJobs.map((job) => <JobRow key={job.id} job={job} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function JobRow({ job }: { job: Job }) {
  const daysLeft = job.expires_at ? daysUntil(job.expires_at) : null

  const statusConfig = {
    active: { label: 'Active', variant: 'emerald' as const },
    pending_payment: { label: 'Awaiting payment', variant: 'yellow' as const },
    draft: { label: 'Draft', variant: 'secondary' as const },
    expired: { label: 'Expired', variant: 'red' as const },
    archived: { label: 'Archived', variant: 'secondary' as const },
  }

  const config = statusConfig[job.status] ?? statusConfig.draft

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link
                href={`/jobs/${job.slug}`}
                className="font-semibold hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
              >
                {job.title}
              </Link>
              <Badge variant={config.variant}>{config.label}</Badge>
              {job.is_featured && <Badge variant="emerald">Featured</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {roleTypeLabel(job.role_type)} · {workplaceLabel(job.workplace_type)}
              {job.location && ` · ${job.location}`}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              {job.published_at && (
                <span>Published {formatDate(job.published_at)}</span>
              )}
              {daysLeft !== null && job.status === 'active' && (
                <span className={daysLeft <= 5 ? 'text-yellow-600 dark:text-yellow-500' : ''}>
                  {daysLeft}d remaining
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {job.applicant_count} applicants
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {job.status === 'pending_payment' && (
              <Button size="sm" asChild>
                <Link href={`/dashboard/employer/jobs/${job.id}/checkout`}>Complete payment</Link>
              </Button>
            )}
            {job.status === 'expired' && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/employer/jobs/${job.id}/checkout`}>Renew</Link>
              </Button>
            )}
            {job.status === 'active' && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/employer/jobs/${job.id}/applications`}>View applicants</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 border rounded-lg bg-muted/20">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
