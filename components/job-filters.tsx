'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { School } from '@/lib/supabase/types'

interface JobFiltersProps {
  schools: School[]
}

export function JobFilters({ schools }: JobFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') ?? ''
  const currentSchool = searchParams.get('school') ?? ''
  const currentRoleType = searchParams.get('role_type') ?? ''
  const currentWorkplace = searchParams.get('workplace') ?? ''

  const hasFilters = currentSearch || currentSchool || currentRoleType || currentWorkplace

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    // Reset to page 1 when filtering
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search job titles, companies..."
          defaultValue={currentSearch}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParams({ q: (e.target as HTMLInputElement).value })
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== currentSearch) {
              updateParams({ q: e.target.value })
            }
          }}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* School filter */}
        <Select
          value={currentSchool}
          onValueChange={(value) => updateParams({ school: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.short_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role type filter */}
        <Select
          value={currentRoleType}
          onValueChange={(value) => updateParams({ role_type: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
          </SelectContent>
        </Select>

        {/* Workplace type */}
        <Select
          value={currentWorkplace}
          onValueChange={(value) => updateParams({ workplace: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Workplace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="on-site">On-site</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
