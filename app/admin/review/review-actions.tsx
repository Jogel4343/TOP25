'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

interface ReviewActionsProps {
  candidateId: string
  candidateName: string
}

export function ReviewActions({ candidateId, candidateName }: ReviewActionsProps) {
  const router = useRouter()
  const [showNote, setShowNote] = React.useState(false)
  const [note, setNote] = React.useState('')
  const [loading, setLoading] = React.useState<'approve' | 'reject' | null>(null)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    const supabase = createClient()

    const newStatus = action === 'approve' ? 'verified_alumni' : 'rejected'
    const isSearchable = action === 'approve'

    const { error } = await supabase
      .from('candidate_profiles')
      .update({
        verification_status: newStatus,
        is_searchable: isSearchable,
      })
      .eq('id', candidateId)

    if (error) {
      setLoading(null)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    if (note.trim()) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('admin_notes').insert({
          target_type: 'candidate_profile',
          target_id: candidateId,
          author_user_id: user.id,
          note: note.trim(),
        })
      }
    }

    setLoading(null)
    toast({
      title: action === 'approve' ? 'Approved!' : 'Rejected',
      description: `${candidateName} has been ${action === 'approve' ? 'approved as verified alumni' : 'rejected'}.`,
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => handleAction('approve')}
          disabled={loading !== null}
        >
          {loading === 'approve' ? '...' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction('reject')}
          disabled={loading !== null}
        >
          {loading === 'reject' ? '...' : 'Reject'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNote(!showNote)}
        >
          Note
        </Button>
      </div>
      {showNote && (
        <Textarea
          placeholder="Admin note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="text-xs"
        />
      )}
    </div>
  )
}
