import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const metadata: Metadata = { title: 'Admin — Schools' }

export default async function AdminSchoolsPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: schools } = await admin
    .from('schools')
    .select('*')
    .order('rank_group')
    .order('name')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Schools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {schools?.length ?? 0} schools configured
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Rank Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(schools ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.short_name}</TableCell>
                <TableCell>{s.rank_group}</TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? 'emerald' : 'secondary'}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {s.id.slice(0, 8)}...
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        To add or edit schools, use the Supabase SQL editor or run a migration.
      </p>
    </div>
  )
}
