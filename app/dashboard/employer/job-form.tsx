'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { jobCreateSchema, type JobCreateInput } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { EmployerProfile, School } from '@/lib/supabase/types'

interface JobFormProps {
  employerProfile: EmployerProfile
  schools: School[]
}

export function JobForm({ employerProfile, schools }: JobFormProps) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [selectedSchools, setSelectedSchools] = React.useState<string[]>([])

  const form = useForm<JobCreateInput>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      title: '',
      location: '',
      workplace_type: 'hybrid',
      compensation: '',
      description: '',
      role_type: 'full-time',
      target_schools: [],
      is_featured: false,
    },
  })

  function toggleSchool(schoolId: string) {
    setSelectedSchools((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    )
  }

  async function onSubmit(data: JobCreateInput) {
    setSaving(true)

    const supabase = createClient()

    // Generate unique slug
    const baseSlug = slugify(data.title, Date.now().toString(36))

    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert({
        employer_id: employerProfile.id,
        title: data.title,
        slug: baseSlug,
        location: data.location ?? null,
        workplace_type: data.workplace_type,
        compensation: data.compensation ?? null,
        description: data.description,
        role_type: data.role_type,
        target_schools: selectedSchools,
        is_featured: data.is_featured,
        status: 'pending_payment',
      })
      .select('id')
      .single()

    setSaving(false)

    if (error) {
      toast({ title: 'Error', description: 'Failed to create job. Please try again.', variant: 'destructive' })
      return
    }

    toast({ title: 'Job created!', description: 'Redirecting to checkout...' })
    router.push(`/dashboard/employer/jobs/${newJob.id}/checkout`)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Job title *</Label>
        <Input id="title" {...form.register('title')} placeholder="Software Engineer, Growth" />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Role type *</Label>
          <Select
            value={form.watch('role_type')}
            onValueChange={(v) => form.setValue('role_type', v as 'full-time' | 'internship' | 'part-time')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Workplace type *</Label>
          <Select
            value={form.watch('workplace_type')}
            onValueChange={(v) => form.setValue('workplace_type', v as 'remote' | 'hybrid' | 'on-site')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="on-site">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...form.register('location')} placeholder="New York, NY" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="compensation">Compensation</Label>
        <Input id="compensation" {...form.register('compensation')} placeholder="$120,000–$150,000 or $8,000/month" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          Job description *{' '}
          <span className="text-muted-foreground font-normal text-xs">
            (Markdown supported: ## for headers, - for bullets, **bold**)
          </span>
        </Label>
        <Textarea
          id="description"
          {...form.register('description')}
          rows={12}
          placeholder="## About the Role\n\nDescribe the position...\n\n## Responsibilities\n\n- Item 1\n- Item 2\n\n## Requirements\n\n- Requirement 1"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Target schools */}
      <div className="space-y-2">
        <Label>
          Target schools{' '}
          <span className="text-muted-foreground font-normal text-xs">
            (leave empty to target all eligible schools)
          </span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {schools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => toggleSchool(school.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedSchools.includes(school.id)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-border hover:border-emerald-400 dark:hover:border-emerald-600'
              }`}
            >
              {school.short_name}
            </button>
          ))}
        </div>
        {selectedSchools.length === 0 && (
          <p className="text-xs text-muted-foreground">No schools selected — job will be visible to all verified candidates.</p>
        )}
      </div>

      {/* Featured toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div>
          <p className="font-medium text-sm">Featured listing</p>
          <p className="text-xs text-muted-foreground">Pins your job to the top of the board (+$39 vs. Founding Post)</p>
        </div>
        <Switch
          checked={form.watch('is_featured')}
          onCheckedChange={(v) => form.setValue('is_featured', v)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Creating job...' : 'Continue to checkout'}
      </Button>
    </form>
  )
}
