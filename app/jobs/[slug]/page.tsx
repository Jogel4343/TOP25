import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Building2, ExternalLink, Star, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { getCandidateProfile } from '@/lib/auth'
import { workplaceLabel, roleTypeLabel, formatDate, daysUntil } from '@/lib/utils'
import { ApplyButton } from './apply-button'

interface JobDetailPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select('title, description, employer:employer_profiles(company_name)')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (!job) {
    return { title: 'Job Not Found' }
  }

  const companyName = (job.employer as { company_name?: string } | null)?.company_name ?? 'Company'

  return {
    title: `${job.title} at ${companyName}`,
    description: job.description.substring(0, 160).replace(/[#*]/g, ''),
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const supabase = createClient()

  // Fetch the job with employer and school data
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      employer:employer_profiles(id, company_name, logo_url, website_url),
      schools:target_schools
    `)
    .eq('slug', params.slug)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!job) notFound()

  // Get school names for target_schools
  const { data: targetSchools } = await supabase
    .from('schools')
    .select('id, name, short_name')
    .in('id', job.target_schools ?? [])

  // Check current user's candidate profile
  const candidateProfile = await getCandidateProfile()

  const employer = job.employer as {
    id: string
    company_name: string
    logo_url?: string | null
    website_url?: string | null
  } | null

  const daysLeft = job.expires_at ? daysUntil(job.expires_at) : null

  // Parse markdown-ish description
  const descriptionHtml = parseSimpleMarkdown(job.description)

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-3xl">
        {/* Back */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2 text-muted-foreground">
            <Link href="/jobs">
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </Link>
          </Button>
        </div>

        {/* Job header */}
        <div className="mb-6">
          {/* Company */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-muted-foreground font-medium">
              {employer?.company_name}
            </span>
            {employer?.website_url && (
              <a
                href={employer.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {job.is_featured && (
              <Badge variant="emerald" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight mb-4">{job.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Badge variant="outline">{roleTypeLabel(job.role_type)}</Badge>
            </span>
            <span className="flex items-center gap-1.5">
              <Badge variant="outline">{workplaceLabel(job.workplace_type)}</Badge>
            </span>
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {job.compensation && (
              <span className="font-medium text-foreground">{job.compensation}</span>
            )}
          </div>

          {/* Additional meta */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            {job.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Posted {formatDate(job.published_at)}
              </span>
            )}
            {daysLeft !== null && (
              <span className={daysLeft <= 5 ? 'text-yellow-600 dark:text-yellow-500 font-medium' : ''}>
                {daysLeft}d remaining
              </span>
            )}
            {job.applicant_count > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {job.applicant_count} applicants
              </span>
            )}
          </div>
        </div>

        {/* Target schools */}
        {targetSchools && targetSchools.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">Targeting candidates from:</p>
                <div className="flex flex-wrap gap-1.5">
                  {targetSchools.map((s) => (
                    <Badge key={s.id} variant="secondary" className="font-normal">
                      {s.short_name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator className="mb-6" />

        {/* Description */}
        <div
          className="job-description text-sm leading-relaxed mb-8"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />

        <Separator className="mb-6" />

        {/* Apply CTA */}
        <ApplyButton job={job} candidateProfile={candidateProfile} />
      </div>
    </div>
  )
}

/**
 * Very simple markdown → HTML converter for job descriptions.
 * Supports: ## h2, ### h3, **bold**, bullet lists, newlines.
 * In production, consider using a proper markdown library.
 */
function parseSimpleMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`
      if (line.startsWith('### ')) return `<h3>${escapeHtml(line.slice(4))}</h3>`
      if (line.startsWith('- ')) return `<ul><li>${escapeHtml(line.slice(2))}</li></ul>`
      if (line.trim() === '') return '<br/>'
      return `<p>${escapeHtml(line).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
    })
    .join('')
    .replace(/<\/ul><ul>/g, '') // merge consecutive ul elements
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
