import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/auth'
import { Shield } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/review', label: 'Candidate Review' },
  { href: '/admin/schools', label: 'Schools' },
  { href: '/admin/domains', label: 'Domains' },
  { href: '/admin/employers', label: 'Employers' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/payments', label: 'Payments' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) redirect('/')

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border/50 bg-muted/20 py-8 px-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
