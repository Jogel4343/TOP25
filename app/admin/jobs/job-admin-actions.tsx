'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

interface JobAdminActionsProps {
  jobId: string
  isFeatured: boolean
  status: string
}

export function JobAdminActions({ jobId, isFeatured, status }: JobAdminActionsProps) {
  const router = useRouter()

  async function toggleFeatured() {
    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .update({ is_featured: !isFeatured })
      .eq('id', jobId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: `Job ${isFeatured ? 'unfeatured' : 'featured'}.` })
    router.refresh()
  }

  async function deactivate() {
    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'archived' })
      .eq('id', jobId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Job archived.' })
    router.refresh()
  }

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={toggleFeatured}>
        {isFeatured ? 'Unfeature' : 'Feature'}
      </Button>
      {status !== 'archived' && (
        <Button size="sm" variant="ghost" className="text-destructive" onClick={deactivate}>
          Archive
        </Button>
      )}
    </div>
  )
}
