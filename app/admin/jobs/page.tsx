import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { JobAdminActions } from './job-admin-actions'

export const metadata: Metadata = { title: 'Admin — Jobs' }

export default async function AdminJobsPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: jobs } = await admin
    .from('jobs')
    .select(`
      id, title, slug, status, is_featured, applicant_count, published_at, expires_at,
      employer:employer_profiles(company_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">All Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">{jobs?.length ?? 0} jobs</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(jobs ?? []).map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <Link
                    href={`/jobs/${j.slug}`}
                    className="font-medium hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                  >
                    {j.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(j.employer as { company_name: string } | null)?.company_name ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      j.status === 'active' ? 'emerald' :
                      j.status === 'pending_payment' ? 'yellow' :
                      j.status === 'expired' ? 'red' : 'secondary'
                    }
                  >
                    {j.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {j.is_featured && <Badge variant="emerald">★ Featured</Badge>}
                </TableCell>
                <TableCell>{j.applicant_count}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {j.published_at ? formatDate(j.published_at) : '—'}
                </TableCell>
                <TableCell>
                  <JobAdminActions jobId={j.id} isFeatured={j.is_featured} status={j.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
