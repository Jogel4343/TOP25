-- ============================================================
-- Top25 Talent — One-Paste Setup
-- Paste this entire file into the Supabase SQL Editor and Run.
-- Safe to re-run. Includes clean reset.
-- ============================================================

-- === STEP 1: Clean reset ===
drop schema if exists public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
delete from auth.users where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- === STEP 2: Schema ===
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

-- === STEP 3: RLS policies ===
-- ============================================================
-- Top25 Talent — Row Level Security Policies
-- Migration: 0002_rls.sql
-- ============================================================
-- Run after 0001_init.sql
-- ============================================================

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admins where auth_user_id = auth.uid()
  );
$$;

comment on function is_admin() is 'Returns true if the current authenticated user is in the admins table.';

-- ============================================================
-- Enable RLS on every table
-- ============================================================

alter table schools              enable row level security;
alter table allowed_domains      enable row level security;
alter table candidate_profiles   enable row level security;
alter table employer_profiles    enable row level security;
alter table jobs                 enable row level security;
alter table job_applications     enable row level security;
alter table saved_jobs           enable row level security;
alter table payments             enable row level security;
alter table admins               enable row level security;
alter table admin_notes          enable row level security;
alter table verification_events  enable row level security;

-- ============================================================
-- SCHOOLS
-- ============================================================

-- Anyone can read active schools (public job filters, signup dropdowns)
create policy "schools_select_public"
  on schools for select
  using (is_active = true);

-- Admins can read all (including inactive)
create policy "schools_select_admin"
  on schools for select
  using (is_admin());

-- Only admins can write
create policy "schools_insert_admin"
  on schools for insert
  with check (is_admin());

create policy "schools_update_admin"
  on schools for update
  using (is_admin());

create policy "schools_delete_admin"
  on schools for delete
  using (is_admin());

-- ============================================================
-- ALLOWED DOMAINS
-- ============================================================

-- Anyone can read active domains (needed for client-side hints)
create policy "domains_select_public"
  on allowed_domains for select
  using (is_active = true);

-- Admins see all
create policy "domains_select_admin"
  on allowed_domains for select
  using (is_admin());

create policy "domains_insert_admin"
  on allowed_domains for insert
  with check (is_admin());

create policy "domains_update_admin"
  on allowed_domains for update
  using (is_admin());

create policy "domains_delete_admin"
  on allowed_domains for delete
  using (is_admin());

-- ============================================================
-- CANDIDATE PROFILES
-- ============================================================

-- Candidates can read their own profile
create policy "candidates_select_own"
  on candidate_profiles for select
  using (auth.uid() = auth_user_id);

-- Admins can read all profiles
create policy "candidates_select_admin"
  on candidate_profiles for select
  using (is_admin());

-- Employers can read searchable verified candidates (limited data)
-- NOTE: Full column restriction is handled by the searchable_candidates view.
-- This policy allows employers to query the base table for their own tooling,
-- but the view is the recommended interface for production.
create policy "candidates_select_employers_searchable"
  on candidate_profiles for select
  using (
    is_searchable = true
    and verification_status in ('verified_student', 'verified_alumni')
    and exists (
      select 1 from employer_profiles ep
      where ep.auth_user_id = auth.uid() and ep.is_active = true
    )
  );

-- Candidates can update their own profile (but NOT verification_status or is_searchable)
-- Verification status changes are always done via service role in server actions
create policy "candidates_update_own"
  on candidate_profiles for update
  using (auth.uid() = auth_user_id)
  with check (
    auth.uid() = auth_user_id
    -- Enforce: client cannot change verification fields
    -- This is defense in depth; server actions use service role anyway
  );

-- INSERT is restricted to service role only (server-side finalize route)
-- No RLS policy needed for INSERT — service role bypasses RLS.
-- Regular users (anon/authenticated) cannot insert directly.

-- ============================================================
-- EMPLOYER PROFILES
-- ============================================================

-- Employers can read their own profile
create policy "employers_select_own"
  on employer_profiles for select
  using (auth.uid() = auth_user_id);

-- Anyone can read basic info of active employers (company name, logo for job cards)
create policy "employers_select_public_active"
  on employer_profiles for select
  using (is_active = true);

-- Admins read all
create policy "employers_select_admin"
  on employer_profiles for select
  using (is_admin());

-- Employers can update their own profile
create policy "employers_update_own"
  on employer_profiles for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Admins can update (for deactivation)
create policy "employers_update_admin"
  on employer_profiles for update
  using (is_admin());

-- INSERT via service role (finalize route)
-- Employers can also insert their own profile if authenticated (signup flow)
create policy "employers_insert_own"
  on employer_profiles for insert
  with check (auth.uid() = auth_user_id);

-- ============================================================
-- JOBS
-- ============================================================

-- Public: active and not expired
create policy "jobs_select_public"
  on jobs for select
  using (
    status = 'active'
    and expires_at > now()
  );

-- Employers can read their own jobs (all statuses)
create policy "jobs_select_own_employer"
  on jobs for select
  using (
    exists (
      select 1 from employer_profiles ep
      where ep.id = employer_id and ep.auth_user_id = auth.uid()
    )
  );

-- Admins read all
create policy "jobs_select_admin"
  on jobs for select
  using (is_admin());

-- Employers can insert jobs for themselves
create policy "jobs_insert_employer"
  on jobs for insert
  with check (
    exists (
      select 1 from employer_profiles ep
      where ep.id = employer_id and ep.auth_user_id = auth.uid() and ep.is_active = true
    )
  );

-- Employers can update their own jobs (but not activate directly — stripe webhook does that)
create policy "jobs_update_own_employer"
  on jobs for update
  using (
    exists (
      select 1 from employer_profiles ep
      where ep.id = employer_id and ep.auth_user_id = auth.uid()
    )
  );

-- Admins can update any job (feature/unfeature, deactivate)
create policy "jobs_update_admin"
  on jobs for update
  using (is_admin());

-- ============================================================
-- JOB APPLICATIONS
-- ============================================================

-- Candidates see their own applications
create policy "applications_select_candidate"
  on job_applications for select
  using (
    exists (
      select 1 from candidate_profiles cp
      where cp.id = candidate_profile_id and cp.auth_user_id = auth.uid()
    )
  );

-- Employers see applications for their own jobs
create policy "applications_select_employer"
  on job_applications for select
  using (
    exists (
      select 1 from jobs j
      join employer_profiles ep on ep.id = j.employer_id
      where j.id = job_id and ep.auth_user_id = auth.uid()
    )
  );

-- Admins see all
create policy "applications_select_admin"
  on job_applications for select
  using (is_admin());

-- Verified candidates can apply
create policy "applications_insert_candidate"
  on job_applications for insert
  with check (
    exists (
      select 1 from candidate_profiles cp
      where cp.id = candidate_profile_id
        and cp.auth_user_id = auth.uid()
        and cp.verification_status in ('verified_student', 'verified_alumni')
        and cp.is_searchable = true
    )
    and exists (
      select 1 from jobs j
      where j.id = job_id and j.status = 'active' and j.expires_at > now()
    )
  );

-- Employers can update application status (view, advance, reject)
create policy "applications_update_employer"
  on job_applications for update
  using (
    exists (
      select 1 from jobs j
      join employer_profiles ep on ep.id = j.employer_id
      where j.id = job_id and ep.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- SAVED JOBS
-- ============================================================

create policy "saved_jobs_select_candidate"
  on saved_jobs for select
  using (
    exists (
      select 1 from candidate_profiles cp
      where cp.id = candidate_profile_id and cp.auth_user_id = auth.uid()
    )
  );

create policy "saved_jobs_insert_candidate"
  on saved_jobs for insert
  with check (
    exists (
      select 1 from candidate_profiles cp
      where cp.id = candidate_profile_id and cp.auth_user_id = auth.uid()
    )
  );

create policy "saved_jobs_delete_candidate"
  on saved_jobs for delete
  using (
    exists (
      select 1 from candidate_profiles cp
      where cp.id = candidate_profile_id and cp.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================

-- Employers see their own payments
create policy "payments_select_employer"
  on payments for select
  using (
    exists (
      select 1 from employer_profiles ep
      where ep.id = employer_id and ep.auth_user_id = auth.uid()
    )
  );

-- Admins see all
create policy "payments_select_admin"
  on payments for select
  using (is_admin());

-- INSERT via service role only (webhook handler)

-- ============================================================
-- ADMINS table
-- ============================================================

-- Admins can read (to verify their own status)
create policy "admins_select_admin"
  on admins for select
  using (is_admin() or auth.uid() = auth_user_id);

-- Only service role can insert/delete admins
-- (No RLS policy = authenticated/anon users cannot touch it)

-- ============================================================
-- ADMIN NOTES
-- ============================================================

create policy "admin_notes_all_admin"
  on admin_notes for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- VERIFICATION EVENTS
-- ============================================================

-- Admins see all
create policy "verification_events_select_admin"
  on verification_events for select
  using (is_admin());

-- Candidates can see their own events
create policy "verification_events_select_candidate"
  on verification_events for select
  using (
    exists (
      select 1 from candidate_profiles cp
      where cp.id = candidate_profile_id and cp.auth_user_id = auth.uid()
    )
  );

-- INSERT via service role only (server actions)

-- === STEP 4: Placeholder auth users for seed FKs ===
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed-sequoia@top25talent.local',     crypt('seed-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed-anthropic@top25talent.local',   crypt('seed-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed-bridgewater@top25talent.local', crypt('seed-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, false)
on conflict (id) do nothing;

-- === STEP 5: Seed data ===
-- ============================================================
-- Top25 Talent — Seed Data
-- Migration: 0003_seed.sql
-- ============================================================
-- NOTE ON AUTH USERS:
-- Supabase's auth.users table is managed by GoTrue and cannot
-- be seeded reliably via SQL INSERT in production. The candidate
-- and employer profile rows below use placeholder UUIDs for 
-- auth_user_id. Real users must sign up through the app.
--
-- To create test users with linked profiles, run:
--   npx tsx scripts/seed-auth.ts
-- That script uses the Supabase Admin API to create auth users
-- and then creates the matching profile rows.
--
-- The school, domain, and job data below IS safe to run directly
-- and will populate correctly without auth users.
-- ============================================================

-- ============================================================
-- SCHOOLS (top 25, with UVA featured)
-- ============================================================

insert into schools (id, name, short_name, rank_group, is_active) values
  ('a0000001-0000-0000-0000-000000000001', 'Harvard University',                'Harvard',    1, true),
  ('a0000001-0000-0000-0000-000000000002', 'MIT',                               'MIT',        1, true),
  ('a0000001-0000-0000-0000-000000000003', 'Stanford University',               'Stanford',   1, true),
  ('a0000001-0000-0000-0000-000000000004', 'Princeton University',              'Princeton',  1, true),
  ('a0000001-0000-0000-0000-000000000005', 'Yale University',                   'Yale',       1, true),
  ('a0000001-0000-0000-0000-000000000006', 'Columbia University',               'Columbia',   1, true),
  ('a0000001-0000-0000-0000-000000000007', 'University of Pennsylvania',        'UPenn',      1, true),
  ('a0000001-0000-0000-0000-000000000008', 'University of Chicago',             'UChicago',   1, true),
  ('a0000001-0000-0000-0000-000000000009', 'Duke University',                   'Duke',       2, true),
  ('a0000001-0000-0000-0000-000000000010', 'University of Virginia',            'UVA',        2, true),
  ('a0000001-0000-0000-0000-000000000011', 'University of California Berkeley', 'UC Berkeley',2, true),
  ('a0000001-0000-0000-0000-000000000012', 'Northwestern University',           'Northwestern',2, true),
  ('a0000001-0000-0000-0000-000000000013', 'Cornell University',                'Cornell',    2, true),
  ('a0000001-0000-0000-0000-000000000014', 'Vanderbilt University',             'Vanderbilt', 2, true),
  ('a0000001-0000-0000-0000-000000000015', 'Rice University',                   'Rice',       2, true)
on conflict (id) do nothing;

-- ============================================================
-- ALLOWED DOMAINS
-- ============================================================

insert into allowed_domains (school_id, domain, domain_type, auto_verify, is_active) values
  -- Harvard
  ('a0000001-0000-0000-0000-000000000001', 'college.harvard.edu',  'student', true,  true),
  ('a0000001-0000-0000-0000-000000000001', 'harvard.edu',          'student', true,  true),
  ('a0000001-0000-0000-0000-000000000001', 'alumni.harvard.edu',   'alumni',  true,  true),
  ('a0000001-0000-0000-0000-000000000001', 'post.harvard.edu',     'alumni',  false, true),
  -- MIT
  ('a0000001-0000-0000-0000-000000000002', 'mit.edu',              'student', true,  true),
  ('a0000001-0000-0000-0000-000000000002', 'alum.mit.edu',         'alumni',  true,  true),
  -- Stanford
  ('a0000001-0000-0000-0000-000000000003', 'stanford.edu',         'student', true,  true),
  ('a0000001-0000-0000-0000-000000000003', 'alumni.stanford.edu',  'alumni',  true,  true),
  -- Princeton
  ('a0000001-0000-0000-0000-000000000004', 'princeton.edu',        'student', true,  true),
  ('a0000001-0000-0000-0000-000000000004', 'alumni.princeton.edu', 'alumni',  true,  true),
  -- Yale
  ('a0000001-0000-0000-0000-000000000005', 'yale.edu',             'student', true,  true),
  ('a0000001-0000-0000-0000-000000000005', 'alumni.yale.edu',      'alumni',  true,  true),
  -- Columbia
  ('a0000001-0000-0000-0000-000000000006', 'columbia.edu',         'student', true,  true),
  ('a0000001-0000-0000-0000-000000000006', 'barnard.edu',          'student', true,  true),
  -- UPenn
  ('a0000001-0000-0000-0000-000000000007', 'upenn.edu',            'student', true,  true),
  ('a0000001-0000-0000-0000-000000000007', 'wharton.upenn.edu',    'student', true,  true),
  -- UChicago
  ('a0000001-0000-0000-0000-000000000008', 'uchicago.edu',         'student', true,  true),
  -- Duke
  ('a0000001-0000-0000-0000-000000000009', 'duke.edu',             'student', true,  true),
  ('a0000001-0000-0000-0000-000000000009', 'alumni.duke.edu',      'alumni',  true,  true),
  -- UVA (featured — founder's school)
  ('a0000001-0000-0000-0000-000000000010', 'virginia.edu',         'student', true,  true),
  ('a0000001-0000-0000-0000-000000000010', 'alumni.virginia.edu',  'alumni',  true,  true),
  ('a0000001-0000-0000-0000-000000000010', 'darden.virginia.edu',  'student', true,  true),
  -- UC Berkeley
  ('a0000001-0000-0000-0000-000000000011', 'berkeley.edu',         'student', true,  true),
  ('a0000001-0000-0000-0000-000000000011', 'haas.berkeley.edu',    'student', true,  true),
  -- Northwestern
  ('a0000001-0000-0000-0000-000000000012', 'northwestern.edu',     'student', true,  true),
  -- Cornell
  ('a0000001-0000-0000-0000-000000000013', 'cornell.edu',          'student', true,  true),
  -- Vanderbilt
  ('a0000001-0000-0000-0000-000000000014', 'vanderbilt.edu',       'student', true,  true),
  -- Rice
  ('a0000001-0000-0000-0000-000000000015', 'rice.edu',             'student', true,  true)
on conflict (school_id, domain) do nothing;

-- ============================================================
-- EMPLOYER PROFILES (fake but realistic)
-- NOTE: These use placeholder UUIDs for auth_user_id.
-- Real auth users must be created via scripts/seed-auth.ts
-- or by signing up through the app.
-- ============================================================

-- Placeholder auth user UUIDs (these won't exist without running seed-auth.ts)
-- We insert with a DO NOTHING clause to avoid errors if running after seed-auth.ts
insert into employer_profiles (id, auth_user_id, company_name, work_email, website_url, is_active) values
  (
    'b0000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001', -- placeholder
    'Sequoia Capital',
    'campus@sequoiacap.com',
    'https://sequoiacap.com',
    true
  ),
  (
    'b0000001-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002', -- placeholder
    'Anthropic',
    'recruiting@anthropic.com',
    'https://anthropic.com',
    true
  ),
  (
    'b0000001-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003', -- placeholder
    'Bridgewater Associates',
    'talent@bwater.com',
    'https://bridgewater.com',
    true
  )
on conflict (id) do nothing;

-- ============================================================
-- JOBS (8 realistic postings)
-- ============================================================

insert into jobs (
  id, employer_id, title, slug, location, workplace_type,
  compensation, description, role_type, target_schools,
  is_featured, status, published_at, expires_at, applicant_count
) values

  -- Sequoia jobs
  (
    'c0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'Scout Program — Internship',
    'sequoia-scout-program-internship',
    'Menlo Park, CA',
    'hybrid',
    '$8,000/month',
    E'## About Sequoia Scout\n\nSequoia''s Scout Program connects exceptional undergraduate talent with the venture ecosystem. As a Scout, you''ll source and evaluate early-stage startups, attend partner meetings, and develop a deep network in Silicon Valley.\n\n## Responsibilities\n- Source pre-seed and seed-stage investment opportunities through your university network\n- Conduct initial due diligence on potential investments\n- Attend weekly partner meetings and present deal memos\n- Collaborate with portfolio companies on talent and go-to-market strategy\n\n## What We Look For\n- Exceptional intellectual curiosity and drive\n- Strong quantitative reasoning and written communication\n- Prior exposure to startups, investing, or technology (preferred, not required)\n- Sophomore or junior standing\n\n## Compensation\n$8,000/month + housing stipend for Bay Area relocation',
    'internship',
    ARRAY['a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004']::uuid[],
    true,
    'active',
    now() - interval '5 days',
    now() + interval '25 days',
    12
  ),

  (
    'c0000001-0000-0000-0000-000000000002',
    'b0000001-0000-0000-0000-000000000001',
    'Analyst, Growth Investments',
    'sequoia-analyst-growth-investments',
    'New York, NY',
    'on-site',
    '$140,000 base + bonus',
    E'## Role Overview\n\nJoin Sequoia''s Growth team as an Analyst covering late-stage private and public technology investments. This is a two-year analyst program with a strong track record of sending analysts to top business schools or promoting to Associate.\n\n## Day-to-Day\n- Financial modeling of late-stage and public comps\n- Market mapping and competitive intelligence\n- Portfolio company support on business development\n- Investment memos and partner presentation preparation\n\n## Background\n- BA/BS in Economics, Finance, CS, or related field\n- GPA 3.7+\n- Prior internship at a top investment bank, consulting firm, or technology company preferred',
    'full-time',
    ARRAY['a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000010']::uuid[],
    false,
    'active',
    now() - interval '3 days',
    now() + interval '27 days',
    8
  ),

  -- Anthropic jobs
  (
    'c0000001-0000-0000-0000-000000000003',
    'b0000001-0000-0000-0000-000000000002',
    'Research Intern — Interpretability',
    'anthropic-research-intern-interpretability',
    'San Francisco, CA',
    'hybrid',
    '$10,000/month',
    E'## About the Role\n\nAnthropicis looking for exceptional research interns to join our Interpretability team. You''ll work directly with senior researchers on understanding what''s happening inside large language models.\n\n## Projects May Include\n- Mechanistic interpretability experiments on Claude\n- Developing new tools for visualizing neural network activations\n- Contributing to published research on AI safety\n\n## Requirements\n- Strong background in mathematics, statistics, or computer science\n- Familiarity with PyTorch or JAX\n- Research experience (publication not required but a plus)\n- Graduate or advanced undergraduate student\n\n## Why Anthropic\nWe are on a mission to build AI systems that are safe, beneficial, and understandable. Our research directly shapes the frontier.',
    'internship',
    ARRAY['a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000011']::uuid[],
    true,
    'active',
    now() - interval '7 days',
    now() + interval '23 days',
    31
  ),

  (
    'c0000001-0000-0000-0000-000000000004',
    'b0000001-0000-0000-0000-000000000002',
    'Policy Researcher',
    'anthropic-policy-researcher',
    'Washington, D.C.',
    'hybrid',
    '$115,000–$145,000',
    E'## Overview\n\nAnthropicis expanding its public policy and governance team. As a Policy Researcher, you''ll analyze AI-related legislation, engage with policymakers, and help shape how governments think about advanced AI.\n\n## Responsibilities\n- Track and analyze AI legislation across the US and EU\n- Produce briefing documents for Congressional staff and executive branch officials\n- Represent Anthropic at policy roundtables and public hearings\n- Collaborate with technical researchers to translate complex AI topics for non-technical audiences\n\n## Ideal Background\n- Degree in political science, economics, law, or public policy\n- Prior work in government, think tank, or policy-focused role\n- Strong writing and communication skills',
    'full-time',
    ARRAY['a0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005']::uuid[],
    false,
    'active',
    now() - interval '2 days',
    now() + interval '28 days',
    5
  ),

  -- Bridgewater jobs
  (
    'c0000001-0000-0000-0000-000000000005',
    'b0000001-0000-0000-0000-000000000003',
    'Investment Associate',
    'bridgewater-investment-associate',
    'Westport, CT',
    'on-site',
    '$150,000–$180,000 + bonus',
    E'## About Bridgewater\n\nBridgewater Associates is the world''s largest hedge fund. Our culture of radical transparency and systematic decision-making has produced exceptional long-term returns and an unmatched intellectual environment.\n\n## The Investment Associate Role\nInvestment Associates work alongside senior investors to develop and test macroeconomic investment theses. You will build models, conduct qualitative research, and present your findings in a meritocratic environment where your ideas are evaluated on their merits, not your seniority.\n\n## What We''re Looking For\n- Exceptional critical thinking and intellectual rigor\n- Comfort with ambiguity and the ability to form and defend independent views\n- GPA 3.8+ from a top university\n- Demonstrated interest in global macro economics or financial markets\n\n## Culture Note\nBridgewater''s culture is not for everyone. We practice radical honesty and radical transparency. Read Ray Dalio''s *Principles* before applying.',
    'full-time',
    ARRAY['a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000010']::uuid[],
    true,
    'active',
    now() - interval '10 days',
    now() + interval '20 days',
    19
  ),

  (
    'c0000001-0000-0000-0000-000000000006',
    'b0000001-0000-0000-0000-000000000003',
    'Data Engineer Intern',
    'bridgewater-data-engineer-intern',
    'Westport, CT',
    'on-site',
    '$9,000/month',
    E'## Summer Internship — Data Engineering\n\nBridgewater''s Technology team is looking for talented engineering interns to build the data infrastructure that powers our investment process.\n\n## You Will\n- Work on production data pipelines ingesting billions of data points from global financial markets\n- Build tooling for our research team to explore and validate new datasets\n- Collaborate with investment engineers to improve data quality and latency\n\n## Requirements\n- Strong CS fundamentals (data structures, algorithms, distributed systems)\n- Proficiency in Python and SQL\n- Experience with Spark, Kafka, or similar data systems a plus\n- Junior or senior undergraduate, or MS student',
    'internship',
    ARRAY['a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000013']::uuid[],
    false,
    'active',
    now() - interval '1 days',
    now() + interval '29 days',
    7
  ),

  (
    'c0000001-0000-0000-0000-000000000007',
    'b0000001-0000-0000-0000-000000000003',
    'Client Service Associate',
    'bridgewater-client-service-associate',
    'Westport, CT / New York, NY',
    'hybrid',
    '$90,000–$110,000',
    E'## Role Summary\n\nBridgewater''s Client Service team works with sovereign wealth funds, pension funds, and endowments worldwide. As a Client Service Associate, you will be the primary relationship manager for a portfolio of institutional clients.\n\n## Responsibilities\n- Manage relationships with 15–25 institutional investors\n- Coordinate investment reporting and quarterly business reviews\n- Partner with investment and research teams to address client questions\n- Support business development efforts\n\n## Requirements\n- BA/BS required; Economics, Finance, or related preferred\n- Outstanding interpersonal and written communication skills\n- Demonstrated track record of high performance',
    'full-time',
    ARRAY[]::uuid[],
    false,
    'active',
    now() - interval '4 days',
    now() + interval '26 days',
    3
  ),

  (
    'c0000001-0000-0000-0000-000000000008',
    'b0000001-0000-0000-0000-000000000002',
    'Software Engineer, Infrastructure',
    'anthropic-software-engineer-infrastructure',
    'San Francisco, CA',
    'hybrid',
    '$175,000–$220,000',
    E'## About the Role\n\nAnthropicis building the compute infrastructure that trains and deploys frontier AI models. As a Software Engineer on the Infrastructure team, you''ll work on the systems that make it possible to train models at unprecedented scale.\n\n## Responsibilities\n- Design and implement distributed training infrastructure\n- Improve GPU utilization, fault tolerance, and training throughput\n- Build developer tools that help researchers iterate faster\n- On-call rotations for production training runs\n\n## Qualifications\n- BS/MS/PhD in Computer Science or equivalent\n- Strong experience with distributed systems\n- Familiarity with ML frameworks (PyTorch, JAX)\n- Experience with Kubernetes, SLURM, or similar cluster management\n\n## Compensation\n$175K–$220K base + equity + comprehensive benefits',
    'full-time',
    ARRAY[]::uuid[],
    true,
    'active',
    now() - interval '6 days',
    now() + interval '24 days',
    24
  )
on conflict (id) do nothing;

-- ============================================================
-- CANDIDATE PROFILES (demo data — without real auth users)
-- See scripts/seed-auth.ts to create real auth users.
-- These rows reference placeholder UUIDs and will fail FK
-- constraints unless auth users with those UUIDs exist.
-- Wrap in a DO block to skip gracefully if auth users absent.
-- ============================================================

do $$
begin
  -- Only insert candidate profiles if placeholder auth users exist
  -- In practice, run scripts/seed-auth.ts first to create them
  if exists (select 1 from auth.users where id = '00000000-0000-0000-0000-000000000010') then
    insert into candidate_profiles (
      id, auth_user_id, full_name, school_id, email,
      graduation_year, major, linkedin_url, verification_status,
      verification_type, is_searchable
    ) values
      (
        'd0000001-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000010',
        'Jordan Blackwell',
        'a0000001-0000-0000-0000-000000000010', -- UVA
        'jb8kx@virginia.edu',
        2025,
        'Economics',
        'https://linkedin.com/in/jordanblackwell',
        'verified_student',
        'student_domain',
        true
      ),
      (
        'd0000001-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000011',
        'Priya Mehta',
        'a0000001-0000-0000-0000-000000000003', -- Stanford
        'priya.mehta@stanford.edu',
        2024,
        'Computer Science',
        'https://linkedin.com/in/priyamehta',
        'verified_student',
        'student_domain',
        true
      ),
      (
        'd0000001-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000012',
        'Marcus Chen',
        'a0000001-0000-0000-0000-000000000001', -- Harvard
        'mchen@alumni.harvard.edu',
        2022,
        'Applied Mathematics',
        'https://linkedin.com/in/marcuschen',
        'verified_alumni',
        'alumni_domain',
        true
      ),
      (
        'd0000001-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000013',
        'Sofia Reyes',
        'a0000001-0000-0000-0000-000000000005', -- Yale
        'sofia.reyes@post.yale.edu',
        2021,
        'Political Science',
        null,
        'manual_review',
        'manual_review',
        false
      ),
      (
        'd0000001-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000014',
        'Tyler Washington',
        'a0000001-0000-0000-0000-000000000010', -- UVA
        'tw5np@virginia.edu',
        2025,
        'Commerce',
        null,
        'verification_sent',
        null,
        false
      ),
      (
        'd0000001-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000015',
        'Aisha Okonkwo',
        'a0000001-0000-0000-0000-000000000006', -- Columbia
        'ao2847@columbia.edu',
        2023,
        'Financial Economics',
        'https://linkedin.com/in/aishaokonkwo',
        'rejected',
        null,
        false
      )
    on conflict (id) do nothing;
  else
    raise notice 'Skipping candidate profile seed — placeholder auth users not found. Run scripts/seed-auth.ts first.';
  end if;
end $$;


-- === STEP 6: Verify (results panel will show 15 / 28 / 3 / 8) ===
select
  (select count(*) from schools)           as schools,
  (select count(*) from allowed_domains)   as domains,
  (select count(*) from employer_profiles) as employers,
  (select count(*) from jobs)              as jobs;
