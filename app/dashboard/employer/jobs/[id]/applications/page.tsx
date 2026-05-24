import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getEmployerProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ApplicationStatusSelect } from './status-select'

export const metadata: Metadata = { title: 'Applicants' }

interface ApplicationsPageProps {
  params: { id: string }
}

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const profile = await getEmployerProfile()
  if (!profile) redirect('/employers/signup')

  const supabase = createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, slug, applicant_count')
    .eq('id', params.id)
    .eq('employer_id', profile.id)
    .single()

  if (!job) notFound()

  const { data: applications } = await supabase
    .from('job_applications')
    .select(`
      id, status, cover_note, created_at,
      candidate:candidate_profiles(
        id, full_name, graduation_year, major, linkedin_url, verification_status,
        school:schools(name, short_name)
      )
    `)
    .eq('job_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-5xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2 text-muted-foreground mb-4">
            <Link href="/dashboard/employer">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {applications?.length ?? 0} applicant{applications?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {!applications || applications.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No applications yet.</p>
            <Button size="sm" variant="outline" className="mt-4" asChild>
              <Link href={`/jobs/${job.slug}`}>View listing</Link>
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Grad Year</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const candidate = app.candidate as {
                    id: string
                    full_name: string
                    graduation_year: number | null
                    major: string | null
                    linkedin_url: string | null
                    verification_status: string
                    school: { name: string; short_name: string } | null
                  } | null

                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {candidate?.full_name ?? '—'}
                        {app.cover_note && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            &ldquo;{app.cover_note}&rdquo;
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {candidate?.school ? (
                          <Badge variant="secondary">{candidate.school.short_name}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{candidate?.graduation_year ?? '—'}</TableCell>
                      <TableCell>{candidate?.major ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(app.created_at)}
                      </TableCell>
                      <TableCell>
                        <ApplicationStatusSelect applicationId={app.id} currentStatus={app.status} />
                      </TableCell>
                      <TableCell>
                        {candidate?.linkedin_url && (
                          <a
                            href={candidate.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
