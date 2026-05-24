import Link from 'next/link'
import { MapPin, Clock, Building2, Star, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn, workplaceLabel, roleTypeLabel, daysUntil, formatDate } from '@/lib/utils'
import type { Job } from '@/lib/supabase/types'

interface JobCardProps {
  job: Job & {
    employer?: {
      company_name: string
      logo_url?: string | null
    }
    school_names?: string[]
  }
  compact?: boolean
}

export function JobCard({ job, compact = false }: JobCardProps) {
  const remaining = job.expires_at ? daysUntil(job.expires_at) : null
  const isExpiringSoon = remaining !== null && remaining <= 5

  return (
    <Link href={`/jobs/${job.slug}`} className="block group">
      <Card
        className={cn(
          'border border-border transition-all duration-200',
          'hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800',
          job.is_featured && 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20',
          compact && 'shadow-none'
        )}
      >
        <CardContent className={cn('p-5', compact && 'p-4')}>
          <div className="flex items-start justify-between gap-3">
            {/* Left: content */}
            <div className="flex-1 min-w-0">
              {/* Company + featured */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground truncate">
                  {job.employer?.company_name ?? 'Company'}
                </span>
                {job.is_featured && (
                  <Badge variant="emerald" className="gap-1 shrink-0">
                    <Star className="h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3
                className={cn(
                  'font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate',
                  compact ? 'text-base' : 'text-lg'
                )}
              >
                {job.title}
              </h3>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <RolePill type={job.role_type} />
                <WorkplacePill type={job.workplace_type} />
                {job.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                {job.compensation && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {job.compensation}
                  </span>
                )}
              </div>

              {/* Target schools */}
              {!compact && job.school_names && job.school_names.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {job.school_names.slice(0, 3).join(', ')}
                    {job.school_names.length > 3 && ` +${job.school_names.length - 3} more`}
                  </span>
                </div>
              )}
            </div>

            {/* Right: meta */}
            <div className="shrink-0 text-right hidden sm:block">
              {job.applicant_count > 0 && (
                <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground mb-1">
                  <Users className="h-3 w-3" />
                  <span>{job.applicant_count}</span>
                </div>
              )}
              {job.published_at && (
                <span className="text-xs text-muted-foreground block">
                  {formatDate(job.published_at)}
                </span>
              )}
              {isExpiringSoon && remaining !== null && (
                <span className="text-xs text-yellow-600 dark:text-yellow-500 font-medium block mt-1">
                  {remaining}d left
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function RolePill({ type }: { type: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
      type === 'internship'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        : type === 'full-time'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    )}>
      <Clock className="h-3 w-3" />
      {roleTypeLabel(type)}
    </span>
  )
}

function WorkplacePill({ type }: { type: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
      {workplaceLabel(type)}
    </span>
  )
}
