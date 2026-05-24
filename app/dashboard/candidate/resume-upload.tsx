'use client'

import * as React from 'react'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { CandidateProfile } from '@/lib/supabase/types'

interface ResumeUploadProps {
  profile: CandidateProfile
  userId: string
}

export function ResumeUpload({ profile, userId }: ResumeUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [resumeUrl, setResumeUrl] = React.useState<string | null>(profile.resume_url)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const fileName = resumeUrl
    ? resumeUrl.split('/').pop() ?? 'resume.pdf'
    : null

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF.', variant: 'destructive' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB.', variant: 'destructive' })
      return
    }

    setUploading(true)
    const supabase = createClient()

    const path = `${userId}/resume.pdf`
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(path, file, { upsert: true, contentType: 'application/pdf' })

    if (uploadError) {
      setUploading(false)
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' })
      return
    }

    // Update candidate profile with resume path
    const { error: updateError } = await supabase
      .from('candidate_profiles')
      .update({ resume_url: path })
      .eq('auth_user_id', userId)

    setUploading(false)

    if (updateError) {
      toast({ title: 'Profile update failed', description: updateError.message, variant: 'destructive' })
      return
    }

    setResumeUrl(path)
    toast({ title: 'Resume uploaded!', description: 'Your resume has been saved.' })
  }

  async function handleRemove() {
    const supabase = createClient()
    const path = `${userId}/resume.pdf`

    await supabase.storage.from('resumes').remove([path])
    await supabase
      .from('candidate_profiles')
      .update({ resume_url: null })
      .eq('auth_user_id', userId)

    setResumeUrl(null)
    toast({ title: 'Resume removed.' })
  }

  return (
    <div>
      {resumeUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
          <File className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{fileName}</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Replace
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRemove} aria-label="Remove resume">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-border hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer transition-colors"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload resume"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">Upload your resume</p>
          <p className="text-xs text-muted-foreground">PDF only, max 10MB</p>
          {uploading && <p className="text-xs text-emerald-600 mt-2">Uploading...</p>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleUpload}
        aria-label="Resume file input"
      />
    </div>
  )
}
