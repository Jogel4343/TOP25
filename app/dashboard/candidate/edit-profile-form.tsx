'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { candidateProfileUpdateSchema, type CandidateProfileUpdateInput } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/client'
import type { CandidateProfile } from '@/lib/supabase/types'

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 2 + i)

interface EditProfileFormProps {
  profile: CandidateProfile
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const form = useForm<CandidateProfileUpdateInput>({
    resolver: zodResolver(candidateProfileUpdateSchema),
    defaultValues: {
      full_name: profile.full_name,
      graduation_year: profile.graduation_year ?? CURRENT_YEAR,
      major: profile.major ?? '',
      linkedin_url: profile.linkedin_url ?? '',
    },
  })

  async function onSubmit(data: CandidateProfileUpdateInput) {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('candidate_profiles')
      .update({
        full_name: data.full_name,
        graduation_year: data.graduation_year,
        major: data.major,
        linkedin_url: data.linkedin_url ?? null,
      })
      .eq('auth_user_id', profile.auth_user_id)

    setSaving(false)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' })
      return
    }

    setEditing(false)
    toast({ title: 'Profile updated!', description: 'Your changes have been saved.' })
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Full name</span>
            <span>{profile.full_name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Graduation year</span>
            <span>{profile.graduation_year ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Major</span>
            <span>{profile.major ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">LinkedIn</span>
            {profile.linkedin_url ? (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-500 hover:underline underline-offset-4 truncate block"
              >
                View profile
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit profile
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...form.register('full_name')} />
        {form.formState.errors.full_name && (
          <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Graduation year</Label>
        <Select
          value={String(form.watch('graduation_year'))}
          onValueChange={(v) => form.setValue('graduation_year', Number(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRAD_YEARS.map((year) => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="major">Major</Label>
        <Input id="major" {...form.register('major')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
        <Input id="linkedin_url" type="url" {...form.register('linkedin_url')} placeholder="https://linkedin.com/in/..." />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { form.reset(); setEditing(false) }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
