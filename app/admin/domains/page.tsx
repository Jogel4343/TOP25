import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const metadata: Metadata = { title: 'Admin — Domains' }

export default async function AdminDomainsPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: domains } = await admin
    .from('allowed_domains')
    .select(`*, school:schools(name, short_name)`)
    .order('school_id')
    .order('domain_type')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Allowed Domains</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {domains?.length ?? 0} domains configured
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Auto-verify</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(domains ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  {d.school ? (d.school as { short_name: string }).short_name : '—'}
                </TableCell>
                <TableCell className="font-mono text-sm">{d.domain}</TableCell>
                <TableCell>
                  <Badge variant={d.domain_type === 'student' ? 'emerald' : 'secondary'}>
                    {d.domain_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={d.auto_verify ? 'emerald' : 'yellow'}>
                    {d.auto_verify ? 'Auto' : 'Manual'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={d.is_active ? 'emerald' : 'secondary'}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Add/remove domains via Supabase SQL editor. Changes take effect immediately.
      </p>
    </div>
  )
}
