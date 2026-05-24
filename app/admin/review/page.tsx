import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { ReviewActions } from './review-actions'

export const metadata: Metadata = { title: 'Admin — Candidate Review' }

export default async function AdminReviewPage() {
  await requireAdmin()

  const admin = createAdminClient()

  const { data: candidates } = await admin
    .from('candidate_profiles')
    .select(`
      id, full_name, email, verification_status, verification_type,
      created_at, major, graduation_year,
      school:schools(name, short_name)
    `)
    .eq('verification_status', 'manual_review')
    .order('created_at', { ascending: true })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Candidate Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {candidates?.length ?? 0} candidates pending manual review
        </p>
      </div>

      {!candidates || candidates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">No candidates pending review. 🎉</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Grad Year</TableHead>
                <TableHead>Major</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell>
                    {c.school ? (
                      <Badge variant="secondary">
                        {(c.school as { short_name: string }).short_name}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{c.graduation_year ?? '—'}</TableCell>
                  <TableCell>{c.major ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(c.created_at)}
                  </TableCell>
                  <TableCell>
                    <ReviewActions candidateId={c.id} candidateName={c.full_name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
