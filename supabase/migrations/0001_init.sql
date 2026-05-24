-- ============================================================
-- Top25 Talent — Initial Schema
-- Migration: 0001_init.sql
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type domain_type_enum as enum ('student', 'alumni', 'special');

create type verification_status_enum as enum (
  'verification_sent',
  'verified_student',
  'verified_alumni',
  'manual_review',
  'rejected'
);

create type workplace_type_enum as enum ('remote', 'hybrid', 'on-site');

create type role_type_enum as enum ('internship', 'full-time', 'part-time');

create type job_status_enum as enum ('draft', 'pending_payment', 'active', 'expired', 'archived');

create type application_status_enum as enum ('submitted', 'viewed', 'rejected', 'advanced');

-- ============================================================
-- SCHOOLS
-- ============================================================

create table schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  short_name    text not null,
  rank_group    int  not null default 1,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table schools is 'Top-25 US colleges eligible for candidate verification';
comment on column schools.rank_group is '1 = top 10, 2 = 11-25';

-- ============================================================
-- ALLOWED DOMAINS
-- ============================================================

create table allowed_domains (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  domain      text not null,
  domain_type domain_type_enum not null default 'student',
  auto_verify boolean not null default true,
  is_active   boolean not null default true,
  unique (school_id, domain)
);

comment on table allowed_domains is 'Email domains accepted per school, with type and auto-verify flag';
comment on column allowed_domains.auto_verify is 'If true, matching email is auto-verified after OTP. If false, goes to manual_review.';

-- ============================================================
-- CANDIDATE PROFILES
-- ============================================================

create table candidate_profiles (
  id                   uuid primary key default gen_random_uuid(),
  auth_user_id         uuid not null unique references auth.users(id) on delete cascade,
  full_name            text not null,
  school_id            uuid references schools(id) on delete set null,
  email                citext not null,
  graduation_year      int,
  major                text,
  linkedin_url         text,
  resume_url           text,
  verification_status  verification_status_enum not null default 'verification_sent',
  verification_type    text, -- 'student_domain' | 'alumni_domain' | 'manual_review'
  is_searchable        boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table candidate_profiles is 'Extended profile for job-seeking candidates (linked to auth.users)';
comment on column candidate_profiles.is_searchable is 'Only true for verified_student and verified_alumni — controlled by server, never client';
comment on column candidate_profiles.resume_url is 'Supabase Storage path, e.g. resumes/{user_id}/resume.pdf';

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidate_profiles_updated_at
  before update on candidate_profiles
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- EMPLOYER PROFILES
-- ============================================================

create table employer_profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null,
  work_email   citext not null,
  website_url  text,
  logo_url     text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger employer_profiles_updated_at
  before update on employer_profiles
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- JOBS
-- ============================================================

create table jobs (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references employer_profiles(id) on delete cascade,
  title           text not null,
  slug            text not null unique,
  location        text,
  workplace_type  workplace_type_enum not null default 'hybrid',
  compensation    text,
  description     text not null,
  role_type       role_type_enum not null default 'full-time',
  target_schools  uuid[] default '{}',
  is_featured     boolean not null default false,
  status          job_status_enum not null default 'draft',
  published_at    timestamptz,
  expires_at      timestamptz,
  applicant_count int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column jobs.target_schools is 'Array of school UUIDs. Empty means all schools welcome.';
comment on column jobs.slug is 'URL-safe identifier for SEO-friendly job URLs';

create trigger jobs_updated_at
  before update on jobs
  for each row execute procedure update_updated_at_column();

-- ============================================================
-- JOB APPLICATIONS
-- ============================================================

create table job_applications (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references jobs(id) on delete cascade,
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  status               application_status_enum not null default 'submitted',
  cover_note           text,
  created_at           timestamptz not null default now(),
  unique (job_id, candidate_profile_id)
);

-- Increment applicant_count on new application
create or replace function increment_applicant_count()
returns trigger language plpgsql as $$
begin
  update jobs set applicant_count = applicant_count + 1 where id = new.job_id;
  return new;
end;
$$;

create trigger job_applications_increment_count
  after insert on job_applications
  for each row execute procedure increment_applicant_count();

-- Decrement on delete
create or replace function decrement_applicant_count()
returns trigger language plpgsql as $$
begin
  update jobs set applicant_count = greatest(0, applicant_count - 1) where id = old.job_id;
  return old;
end;
$$;

create trigger job_applications_decrement_count
  after delete on job_applications
  for each row execute procedure decrement_applicant_count();

-- ============================================================
-- SAVED JOBS
-- ============================================================

create table saved_jobs (
  id                   uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references candidate_profiles(id) on delete cascade,
  job_id               uuid not null references jobs(id) on delete cascade,
  created_at           timestamptz not null default now(),
  unique (candidate_profile_id, job_id)
);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table payments (
  id                          uuid primary key default gen_random_uuid(),
  employer_id                 uuid not null references employer_profiles(id) on delete cascade,
  job_id                      uuid not null references jobs(id) on delete cascade,
  stripe_checkout_session_id  text not null unique,
  stripe_payment_intent_id    text,
  amount                      int not null, -- in cents
  currency                    text not null default 'usd',
  payment_status              text not null default 'pending',
  pricing_tier                text not null, -- 'founding' | 'featured'
  created_at                  timestamptz not null default now()
);

comment on column payments.amount is 'Amount in cents (e.g. 6000 = $60.00)';
comment on column payments.pricing_tier is '"founding" = $60, "featured" = $99';

-- ============================================================
-- ADMINS
-- ============================================================

create table admins (
  auth_user_id uuid primary key references auth.users(id) on delete cascade
);

comment on table admins is 'Users with admin access. Add rows via SQL editor after first signup.';

-- ============================================================
-- ADMIN NOTES
-- ============================================================

create table admin_notes (
  id             uuid primary key default gen_random_uuid(),
  target_type    text not null, -- 'candidate_profile' | 'employer_profile' | 'job'
  target_id      uuid not null,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  note           text not null,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- VERIFICATION EVENTS (audit log)
-- ============================================================

create table verification_events (
  id                   uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid references candidate_profiles(id) on delete set null,
  email                citext not null,
  school_id            uuid references schools(id) on delete set null,
  domain_checked       text,
  result               text not null, -- 'otp_sent_student' | 'otp_sent_alumni' | 'manual_review' | 'blocked' | 'otp_verified' | 'domain_unknown'
  metadata             jsonb default '{}',
  created_at           timestamptz not null default now()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Public view of searchable candidates (safe columns only for employers)
create view searchable_candidates as
  select
    cp.id,
    cp.full_name,
    cp.school_id,
    s.name as school_name,
    s.short_name as school_short_name,
    cp.graduation_year,
    cp.major,
    cp.linkedin_url,
    cp.verification_status,
    cp.created_at
  from candidate_profiles cp
  join schools s on s.id = cp.school_id
  where cp.is_searchable = true
    and cp.verification_status in ('verified_student', 'verified_alumni');

comment on view searchable_candidates is 'Safe public view of verified candidates. Excludes email, resume_url, auth_user_id.';

-- ============================================================
-- INDEXES
-- ============================================================

-- Jobs board — primary query pattern
create index idx_jobs_status_featured_published
  on jobs (status, is_featured desc, published_at desc)
  where status = 'active';

-- Job slug lookup
create index idx_jobs_slug on jobs (slug);

-- Job expiry — for cron cleanup queries
create index idx_jobs_expires_at on jobs (expires_at) where status = 'active';

-- Candidate filtering
create index idx_candidate_profiles_school_status
  on candidate_profiles (school_id, verification_status);

-- Domain lookup (the hot path for signup verification)
create index idx_allowed_domains_school_domain
  on allowed_domains (school_id, domain)
  where is_active = true;

-- Payment lookup by session ID (webhook handler)
create index idx_payments_stripe_session
  on payments (stripe_checkout_session_id);

-- Application lookup
create index idx_job_applications_candidate
  on job_applications (candidate_profile_id, created_at desc);

create index idx_job_applications_job
  on job_applications (job_id, created_at desc);

-- Saved jobs
create index idx_saved_jobs_candidate
  on saved_jobs (candidate_profile_id, created_at desc);
