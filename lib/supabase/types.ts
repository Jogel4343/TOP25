export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          short_name: string
          rank_group: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          rank_group?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          rank_group?: number
          is_active?: boolean
          created_at?: string
        }
      }
      allowed_domains: {
        Row: {
          id: string
          school_id: string
          domain: string
          domain_type: 'student' | 'alumni' | 'special'
          auto_verify: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          school_id: string
          domain: string
          domain_type?: 'student' | 'alumni' | 'special'
          auto_verify?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          school_id?: string
          domain?: string
          domain_type?: 'student' | 'alumni' | 'special'
          auto_verify?: boolean
          is_active?: boolean
        }
      }
      candidate_profiles: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string
          school_id: string | null
          email: string
          graduation_year: number | null
          major: string | null
          linkedin_url: string | null
          resume_url: string | null
          verification_status: VerificationStatus
          verification_type: string | null
          is_searchable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          full_name: string
          school_id?: string | null
          email: string
          graduation_year?: number | null
          major?: string | null
          linkedin_url?: string | null
          resume_url?: string | null
          verification_status?: VerificationStatus
          verification_type?: string | null
          is_searchable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          full_name?: string
          school_id?: string | null
          email?: string
          graduation_year?: number | null
          major?: string | null
          linkedin_url?: string | null
          resume_url?: string | null
          verification_status?: VerificationStatus
          verification_type?: string | null
          is_searchable?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      employer_profiles: {
        Row: {
          id: string
          auth_user_id: string
          company_name: string
          work_email: string
          website_url: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          company_name: string
          work_email: string
          website_url?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          company_name?: string
          work_email?: string
          website_url?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          slug: string
          location: string | null
          workplace_type: WorkplaceType
          compensation: string | null
          description: string
          role_type: RoleType
          target_schools: string[]
          is_featured: boolean
          status: JobStatus
          published_at: string | null
          expires_at: string | null
          applicant_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          title: string
          slug: string
          location?: string | null
          workplace_type?: WorkplaceType
          compensation?: string | null
          description: string
          role_type?: RoleType
          target_schools?: string[]
          is_featured?: boolean
          status?: JobStatus
          published_at?: string | null
          expires_at?: string | null
          applicant_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          slug?: string
          location?: string | null
          workplace_type?: WorkplaceType
          compensation?: string | null
          description?: string
          role_type?: RoleType
          target_schools?: string[]
          is_featured?: boolean
          status?: JobStatus
          published_at?: string | null
          expires_at?: string | null
          applicant_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          job_id: string
          candidate_profile_id: string
          status: ApplicationStatus
          cover_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_profile_id: string
          status?: ApplicationStatus
          cover_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_profile_id?: string
          status?: ApplicationStatus
          cover_note?: string | null
          created_at?: string
        }
      }
      saved_jobs: {
        Row: {
          id: string
          candidate_profile_id: string
          job_id: string
          created_at: string
        }
        Insert: {
          id?: string
          candidate_profile_id: string
          job_id: string
          created_at?: string
        }
        Update: {
          id?: string
          candidate_profile_id?: string
          job_id?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          employer_id: string
          job_id: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          payment_status: string
          pricing_tier: string
          created_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          job_id: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          payment_status?: string
          pricing_tier: string
          created_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          job_id?: string
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          payment_status?: string
          pricing_tier?: string
          created_at?: string
        }
      }
      admins: {
        Row: { auth_user_id: string }
        Insert: { auth_user_id: string }
        Update: { auth_user_id?: string }
      }
      admin_notes: {
        Row: {
          id: string
          target_type: string
          target_id: string
          author_user_id: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          target_type: string
          target_id: string
          author_user_id: string
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          target_type?: string
          target_id?: string
          author_user_id?: string
          note?: string
          created_at?: string
        }
      }
      verification_events: {
        Row: {
          id: string
          candidate_profile_id: string | null
          email: string
          school_id: string | null
          domain_checked: string | null
          result: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          candidate_profile_id?: string | null
          email: string
          school_id?: string | null
          domain_checked?: string | null
          result: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          candidate_profile_id?: string | null
          email?: string
          school_id?: string | null
          domain_checked?: string | null
          result?: string
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      searchable_candidates: {
        Row: {
          id: string
          full_name: string
          school_id: string | null
          school_name: string
          school_short_name: string
          graduation_year: number | null
          major: string | null
          linkedin_url: string | null
          verification_status: VerificationStatus
          created_at: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      domain_type_enum: 'student' | 'alumni' | 'special'
      verification_status_enum: VerificationStatus
      workplace_type_enum: WorkplaceType
      role_type_enum: RoleType
      job_status_enum: JobStatus
      application_status_enum: ApplicationStatus
    }
  }
}

export type VerificationStatus =
  | 'verification_sent'
  | 'verified_student'
  | 'verified_alumni'
  | 'manual_review'
  | 'rejected'

export type WorkplaceType = 'remote' | 'hybrid' | 'on-site'
export type RoleType = 'internship' | 'full-time' | 'part-time'
export type JobStatus = 'draft' | 'pending_payment' | 'active' | 'expired' | 'archived'
export type ApplicationStatus = 'submitted' | 'viewed' | 'rejected' | 'advanced'
export type PricingTier = 'founding' | 'featured'

// Convenience row types
export type School = Database['public']['Tables']['schools']['Row']
export type AllowedDomain = Database['public']['Tables']['allowed_domains']['Row']
export type CandidateProfile = Database['public']['Tables']['candidate_profiles']['Row']
export type EmployerProfile = Database['public']['Tables']['employer_profiles']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobApplication = Database['public']['Tables']['job_applications']['Row']
export type SavedJob = Database['public']['Tables']['saved_jobs']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type VerificationEvent = Database['public']['Tables']['verification_events']['Row']
