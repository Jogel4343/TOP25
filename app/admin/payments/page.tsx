import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin — Payments' }

export default async function AdminPaymentsPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: payments } = await admin
    .from('payments')
    .select(`
      id, amount, currency, payment_status, pricing_tier, stripe_checkout_session_id, created_at,
      employer:employer_profiles(company_name),
      job:jobs(title, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const total = (payments ?? []).reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Payments</h1>
        <div className="flex gap-6 mt-2">
          <div>
            <span className="text-xs text-muted-foreground">Total revenue</span>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Transactions</span>
            <p className="text-2xl font-bold">{payments?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Session ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(payments ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {(p.employer as { company_name: string } | null)?.company_name ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(p.job as { title: string } | null)?.title ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={p.pricing_tier === 'featured' ? 'emerald' : 'secondary'}>
                    {p.pricing_tier}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <Badge variant={p.payment_status === 'completed' ? 'emerald' : 'yellow'}>
                    {p.payment_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(p.created_at)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {p.stripe_checkout_session_id.slice(0, 14)}...
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
