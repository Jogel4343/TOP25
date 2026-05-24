'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

interface DeactivateEmployerButtonProps {
  employerId: string
  companyName: string
  isActive: boolean
}

export function DeactivateEmployerButton({ employerId, companyName, isActive }: DeactivateEmployerButtonProps) {
  const router = useRouter()

  async function toggle() {
    const supabase = createClient()
    const { error } = await supabase
      .from('employer_profiles')
      .update({ is_active: !isActive })
      .eq('id', employerId)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: `${companyName} ${isActive ? 'deactivated' : 'reactivated'}.` })
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant={isActive ? 'destructive' : 'outline'}
      onClick={toggle}
    >
      {isActive ? 'Deactivate' : 'Reactivate'}
    </Button>
  )
}
