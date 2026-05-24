import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getEmployerProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { JobForm } from '../job-form'

export const metadata: Metadata = { title: 'Post a Job' }

export default async function NewJobPage() {
  const profile = await getEmployerProfile()
  if (!profile) redirect('/employers/signup')

  const supabase = createClient()
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, short_name, rank_group, is_active, created_at')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="py-8 md:py-12">
      <div className="container max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Post a new job</h1>
        <JobForm employerProfile={profile} schools={schools ?? []} />
      </div>
    </div>
  )
}
