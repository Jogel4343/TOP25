import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { DeactivateEmployerButton } from './deactivate-button'

export const metadata: Metadata = { title: 'Admin — Employers' }

export default async function AdminEmployersPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: employers } = await admin
    .from('employer_profiles')
    .select('id, company_name, work_email, website_url, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Employers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {employers?.length ?? 0} employer accounts
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(employers ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.company_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.work_email}</TableCell>
                <TableCell>
                  <Badge variant={e.is_active ? 'emerald' : 'secondary'}>
                    {e.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(e.created_at)}
                </TableCell>
                <TableCell>
                  <DeactivateEmployerButton
                    employerId={e.id}
                    companyName={e.company_name}
                    isActive={e.is_active}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
