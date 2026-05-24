import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getEmployerProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Job Posted Successfully!' }

interface SuccessPageProps {
  params: { id: string }
}

export default async function JobSuccessPage({ params }: SuccessPageProps) {
  const profile = await getEmployerProfile()
  if (!profile) redirect('/employers/signup')

  const supabase = createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, slug, status')
    .eq('id', params.id)
    .eq('employer_id', profile.id)
    .single()

  if (!job) redirect('/dashboard/employer')

  const isActive = job.status === 'active'

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {isActive ? 'Job is live!' : 'Payment processing...'}
        </h1>

        <p className="text-muted-foreground mb-2">
          <span className="font-medium text-foreground">{job.title}</span>
        </p>

        {isActive ? (
          <p className="text-sm text-muted-foreground mb-8">
            Your job is now visible to all verified candidates. It will remain active for 30 days.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-8">
            Your payment is being confirmed. Your job will go live within a few seconds.
            Refresh your dashboard if it doesn&apos;t appear.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isActive && (
            <Button asChild>
              <Link href={`/jobs/${job.slug}`}>
                View job listing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
          <Button variant={isActive ? 'outline' : 'default'} asChild>
            <Link href="/dashboard/employer">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
