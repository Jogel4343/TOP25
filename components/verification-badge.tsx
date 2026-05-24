import { ShieldCheck, ShieldAlert, Clock, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/lib/supabase/types'

interface VerificationBadgeProps {
  status: VerificationStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function VerificationBadge({
  status,
  size = 'md',
  showIcon = true,
}: VerificationBadgeProps) {
  const config = getBadgeConfig(status)

  return (
    <Badge
      variant={config.variant as 'emerald' | 'yellow' | 'red' | 'outline'}
      className={cn(
        'gap-1 font-medium',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1'
      )}
    >
      {showIcon && <config.Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {config.label}
    </Badge>
  )
}

function getBadgeConfig(status: VerificationStatus) {
  switch (status) {
    case 'verified_student':
      return {
        label: 'Verified Student',
        variant: 'emerald',
        Icon: ShieldCheck,
      }
    case 'verified_alumni':
      return {
        label: 'Verified Alumni',
        variant: 'emerald',
        Icon: ShieldCheck,
      }
    case 'manual_review':
      return {
        label: 'Pending Review',
        variant: 'yellow',
        Icon: Clock,
      }
    case 'verification_sent':
      return {
        label: 'Verify Email',
        variant: 'yellow',
        Icon: Clock,
      }
    case 'rejected':
      return {
        label: 'Not Verified',
        variant: 'red',
        Icon: ShieldAlert,
      }
    default:
      return {
        label: status,
        variant: 'outline',
        Icon: Shield,
      }
  }
}
