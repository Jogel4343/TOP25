import { z } from 'zod'

// ============================================================
// Candidate schemas
// ============================================================

export const candidateSignupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  school_id: z.string().uuid('Please select a school'),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  graduation_year: z
    .number()
    .int()
    .min(2000, 'Graduation year seems too early')
    .max(2035, 'Graduation year seems too far in the future'),
  major: z.string().min(2, 'Please enter your major').max(100),
  linkedin_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
})

export type CandidateSignupInput = z.infer<typeof candidateSignupSchema>

export const otpVerifySchema = z.object({
  email: z.string().email(),
  token: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
})

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>

export const candidateProfileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100),
  graduation_year: z.number().int().min(2000).max(2035),
  major: z.string().min(2).max(100),
  linkedin_url: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
})

export type CandidateProfileUpdateInput = z.infer<typeof candidateProfileUpdateSchema>

// ============================================================
// Employer schemas
// ============================================================

export const employerSignupSchema = z.object({
  work_email: z.string().email('Please enter a valid work email').toLowerCase(),
  company_name: z.string().min(2, 'Company name is required').max(100),
  website_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
})

export type EmployerSignupInput = z.infer<typeof employerSignupSchema>

// ============================================================
// Job schemas
// ============================================================

export const jobCreateSchema = z.object({
  title: z.string().min(5, 'Job title is required').max(100),
  location: z.string().max(100).optional().or(z.literal('')).transform((v) => v || null),
  workplace_type: z.enum(['remote', 'hybrid', 'on-site']),
  compensation: z.string().max(100).optional().or(z.literal('')).transform((v) => v || null),
  description: z.string().min(50, 'Description must be at least 50 characters').max(10000),
  role_type: z.enum(['internship', 'full-time', 'part-time']),
  target_schools: z.array(z.string().uuid()).default([]),
  is_featured: z.boolean().default(false),
})

export type JobCreateInput = z.infer<typeof jobCreateSchema>

export const jobUpdateSchema = jobCreateSchema.partial()

export type JobUpdateInput = z.infer<typeof jobUpdateSchema>

// ============================================================
// Admin schemas
// ============================================================

export const adminReviewSchema = z.object({
  candidate_profile_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  note: z.string().max(1000).optional(),
})

export type AdminReviewInput = z.infer<typeof adminReviewSchema>

export const adminSchoolSchema = z.object({
  name: z.string().min(2).max(100),
  short_name: z.string().min(1).max(20),
  rank_group: z.number().int().min(1).max(3),
  is_active: z.boolean().default(true),
})

export type AdminSchoolInput = z.infer<typeof adminSchoolSchema>

export const adminDomainSchema = z.object({
  school_id: z.string().uuid(),
  domain: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Please enter a valid domain (e.g. virginia.edu)'),
  domain_type: z.enum(['student', 'alumni', 'special']),
  auto_verify: z.boolean().default(true),
  is_active: z.boolean().default(true),
})

export type AdminDomainInput = z.infer<typeof adminDomainSchema>

// ============================================================
// Checkout schema
// ============================================================

export const checkoutSchema = z.object({
  job_id: z.string().uuid(),
  pricing_tier: z.enum(['founding', 'featured']),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

// ============================================================
// Job application schema
// ============================================================

export const jobApplicationSchema = z.object({
  job_id: z.string().uuid(),
  cover_note: z.string().max(1000).optional().or(z.literal('')).transform((v) => v || null),
})

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>
