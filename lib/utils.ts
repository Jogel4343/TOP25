import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx support.
 * Used by all shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Convert a job title and optional suffix to a URL-safe slug.
 * e.g. "Software Engineer, Infrastructure" → "software-engineer-infrastructure"
 */
export function slugify(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/[\s_]+/g, '-')  // spaces/underscores → hyphens
    .replace(/-+/g, '-')       // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')   // trim leading/trailing hyphens
    .substring(0, 80)          // max 80 chars for base

  return suffix ? `${base}-${suffix}` : base
}

/**
 * Format a number of cents as a USD currency string.
 * e.g. 6000 → "$60.00"
 */
export function formatCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Format a date string (ISO) to a human-readable relative or absolute form.
 */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate))
}

/**
 * Return number of days until a date.
 * Returns 0 if in the past.
 */
export function daysUntil(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

/**
 * Return a friendly label for a VerificationStatus.
 */
export function verificationStatusLabel(
  status: string
): { label: string; color: 'emerald' | 'yellow' | 'red' | 'neutral' } {
  switch (status) {
    case 'verified_student':
      return { label: 'Verified Student', color: 'emerald' }
    case 'verified_alumni':
      return { label: 'Verified Alumni', color: 'emerald' }
    case 'manual_review':
      return { label: 'Pending Review', color: 'yellow' }
    case 'verification_sent':
      return { label: 'Email Sent', color: 'yellow' }
    case 'rejected':
      return { label: 'Not Verified', color: 'red' }
    default:
      return { label: status, color: 'neutral' }
  }
}

/**
 * Workplace type label.
 */
export function workplaceLabel(type: string): string {
  switch (type) {
    case 'remote':
      return 'Remote'
    case 'hybrid':
      return 'Hybrid'
    case 'on-site':
      return 'On-site'
    default:
      return type
  }
}

/**
 * Role type label.
 */
export function roleTypeLabel(type: string): string {
  switch (type) {
    case 'full-time':
      return 'Full-time'
    case 'internship':
      return 'Internship'
    case 'part-time':
      return 'Part-time'
    default:
      return type
  }
}

/**
 * Truncate a string to maxLength characters with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 1) + '…'
}

/**
 * Extract initials from a full name (up to 2 chars).
 * e.g. "Jordan Blackwell" → "JB"
 */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}

/**
 * Get the absolute URL for a path.
 * Uses NEXT_PUBLIC_SITE_URL in production, localhost:3000 in dev.
 */
export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}${path}`
}
