-- ============================================================
-- FIX_GRANTS.sql
-- Grants table-level privileges to anon/authenticated roles so
-- the RLS policies can actually take effect. Without these,
-- PostgREST returns 42501 "permission denied for table" before
-- it even evaluates RLS.
--
-- Run this once in the Supabase SQL editor.
-- Safe to re-run.
-- ============================================================

-- Public read access (RLS policies still filter rows)
grant select on schools          to anon, authenticated;
grant select on allowed_domains  to anon, authenticated;
grant select on jobs             to anon, authenticated;
grant select on employer_profiles to anon, authenticated;
grant select on searchable_candidates to authenticated;

-- Authenticated user actions (RLS policies still gate which rows)
grant select, insert, update, delete on candidate_profiles to authenticated;
grant select, insert, update, delete on applications       to authenticated;
grant select, insert, update, delete on saved_jobs         to authenticated;
grant select, insert, update         on employer_profiles  to authenticated;
grant select, insert, update         on jobs               to authenticated;
grant select, insert on verification_events                to authenticated;
grant select        on payments                            to authenticated;
grant select        on admins                              to authenticated;

-- Sequence usage so inserts with bigserial/identity work
grant usage, select on all sequences in schema public to authenticated;

-- Make future tables/sequences inherit these grants too
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- Verify
select 'schools readable as anon' as check,
       has_table_privilege('anon', 'public.schools', 'SELECT') as ok;
