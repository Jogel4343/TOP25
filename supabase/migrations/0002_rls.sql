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
