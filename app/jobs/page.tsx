import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/job-card'
import { JobFilters } from '@/components/job-filters'
import type { School } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Browse Jobs',
  description:
    'Browse internships and full-time jobs from top employers targeting verified students and alumni from elite universities.',
}

interface JobsPageProps {
  searchParams: {
    q?: string
    school?: string
    role_type?: string
    workplace?: string
    page?: string
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const supabase = createClient()

  const { q, school, role_type, workplace } = searchParams

  // Fetch schools for filter dropdown
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, short_name, rank_group, is_active, created_at')
    .eq('is_active', true)
    .order('name')

  // Build jobs query
  let query = supabase
    .from('jobs')
    .select(`
      *,
      employer:employer_profiles(company_name, logo_url)
    `)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())

  // Apply text search
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // Apply role type filter
  if (role_type && ['internship', 'full-time', 'part-time'].includes(role_type)) {
    query = query.eq('role_type', role_type as 'internship' | 'full-time' | 'part-time')
  }

  // Apply workplace filter
  if (workplace && ['remote', 'hybrid', 'on-site'].includes(workplace)) {
    query = query.eq('workplace_type', workplace as 'remote' | 'hybrid' | 'on-site')
  }

  // Order: featured first, then by published_at desc
  query = query.order('is_featured', { ascending: false }).order('published_at', { ascending: false })

  const { data: jobs, error } = await query

  // Filter by school (client-side on target_schools array)
  // School filter uses PostgreSQL array overlap — filter after fetch for simplicity
  const filteredJobs = school
    ? (jobs ?? []).filter(
        (job) =>
          !job.target_schools ||
          job.target_schools.length === 0 ||
          job.target_schools.includes(school)
      )
    : (jobs ?? [])

  // Enrich jobs with school names
  const schoolMap = new Map((schools ?? []).map((s: School) => [s.id, s.short_name]))

  const enrichedJobs = filteredJobs.map((job) => ({
    ...job,
    employer: job.employer
      ? { company_name: (job.employer as { company_name: string }).company_name, logo_url: (job.employer as { logo_url?: string | null }).logo_url }
      : undefined,
    school_names: (job.target_schools ?? [])
      .map((id: string) => schoolMap.get(id))
      .filter(Boolean) as string[],
  }))

  const featuredJobs = enrichedJobs.filter((j) => j.is_featured)
  const regularJobs = enrichedJobs.filter((j) => !j.is_featured)

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Job board</h1>
          <p className="text-muted-foreground text-sm">
            {enrichedJobs.length} active{' '}
            {enrichedJobs.length === 1 ? 'opportunity' : 'opportunities'} — verified candidates
            only
          </p>
        </div>

        {/* Filters */}
        <Suspense>
          <div className="mb-6">
            <JobFilters schools={schools ?? []} />
          </div>
        </Suspense>

        {/* No results */}
        {enrichedJobs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No jobs match your filters</p>
            <p className="text-sm">Try adjusting or clearing your search filters.</p>
          </div>
        )}

        {/* Featured jobs */}
        {featuredJobs.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Featured
            </p>
            <div className="space-y-3">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Regular jobs */}
        {regularJobs.length > 0 && (
          <div>
            {featuredJobs.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                All jobs
              </p>
            )}
            <div className="space-y-3">
              {regularJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            Failed to load jobs. Please try refreshing.
          </div>
        )}
      </div>
    </div>
  )
}
