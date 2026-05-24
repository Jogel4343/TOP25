# Architecture Decisions — Top25 Talent

## Why Supabase

Supabase bundles PostgreSQL, auth, file storage, and a REST/realtime API into a single managed service. For a solo founder, this eliminates the need to operate separate services for each concern. Row Level Security in Postgres means the authorization model lives at the database layer — not scattered across API endpoints — which is both more secure and easier to audit.

The service role client (Supabase admin) is only imported inside `lib/supabase/admin.ts`, which is marked `import 'server-only'`. TypeScript and Next.js will error at build time if this file is imported by a Client Component.

## Why OTP Over Magic Link

Magic Links are URL-based: the server sends a link like `https://your-site/auth/callback?code=...` and the user clicks it. This pattern has two failure modes that matter for a recruiting product:

1. **Email security scanners** (common at large companies with IT policies) will pre-fetch the link to scan for malware. Supabase detects this as a "click" and invalidates the link before the user sees it.
2. **Copy-paste on mobile** is harder than typing 6 digits.

Email OTP (one-time passcode) avoids both. We configure Supabase to send a 6-digit numeric code. The user opens the email, reads the code, types it in a mobile-friendly digit input. No URL to click. We still configure Supabase's magic link redirect URL (`/auth/callback`) as a fallback, but OTP is the primary flow.

## Domain Check Is The School Proof — OTP Is The Inbox Proof

These are two separate claims:
- **School affiliation**: "This person attended or attends MIT." Proven by domain matching against `allowed_domains` before the OTP is sent.
- **Inbox ownership**: "This person controls that email address." Proven by correctly entering the OTP.

Both are required. Domain matching alone can be faked (anyone can claim any email). OTP alone only proves inbox ownership, not that the email is a school email. Together, they prove: "This person controls a school-issued email inbox."

The domain check runs **server-side in a server action** before `signInWithOtp` is called. The client cannot tamper with this check.

## Alumni Manual Review Path

Alumni often find their `.edu` email has expired after graduation. We handle this with a graceful fallback:

1. If an alumni domain exists in `allowed_domains` with `auto_verify=false`, we still send OTP (to confirm inbox ownership) but mark the profile `manual_review` after verification.
2. If the domain is entirely unknown (not in `allowed_domains`), same behavior — send OTP, mark `manual_review`.
3. Admin reviews the profile in `/admin/review` and approves or rejects.

This means alumni with expired `.edu` addresses can still participate — they just need a manual check.

## RLS As The Data Moat

Three layers protect candidate data:

1. **Application layer**: The `requireCandidate()` helper in `lib/auth.ts` checks verification status before allowing dashboard access.
2. **RLS policies**: `is_searchable = true AND verification_status IN ('verified_student', 'verified_alumni')` filters are baked into Postgres policies. Employer queries never return unverified candidates, regardless of what the application code does.
3. **`searchable_candidates` view**: Exposes only safe columns (name, school, major, linkedin_url — never email, resume_url, or auth_user_id). Employers should query this view, not the base table.

The `is_admin()` SQL function checks the `admins` table. It's used as `USING (is_admin())` in all admin RLS policies, which means it's evaluated per-row, per-request, inside the database. Bypassing it would require compromising the database itself.

## Stripe Webhook Is The Source Of Truth For Job Activation

Stripe checkout redirects (success_url) can be tampered with. A malicious user could navigate directly to the success URL without completing payment, or modify the redirect URL. We guard against this by:

1. The success page (`/dashboard/employer/jobs/[id]/success`) shows the job status from the database — it does NOT activate the job.
2. The Stripe webhook (`/api/stripe/webhook`) is the only code path that calls `UPDATE jobs SET status = 'active'`.
3. The webhook verifies the Stripe signature using `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` before processing any data.
4. The raw body is read with `await request.text()` before any parsing — Next.js App Router does not pre-parse route handler bodies.

Duplicate webhooks (Stripe can send the same event multiple times) are handled by the unique constraint on `payments.stripe_checkout_session_id` — the second insert will fail with `23505`, which we detect and return `200` to Stripe without re-activating.

## Why `slug` On Jobs

Clean, stable URLs like `/jobs/sequoia-scout-program-internship` are better than `/jobs/some-uuid` for:
- SEO: Google can index job listings and understand the content from the URL.
- Sharing: URLs are human-readable.
- Stability: UUIDs change if we ever migrate data; slugs are stable.

Slugs are generated at job creation time from the title + a timestamp suffix to ensure uniqueness.

## Supabase Storage For Resumes

Resumes are stored in a private Supabase Storage bucket named `resumes`. The RLS policy on the bucket allows:
- Candidates: read and write their own files (`{auth_user_id}/resume.pdf`)
- Employers: read candidate resume files if the candidate has applied to their job (to be implemented as a Storage policy or signed URL approach)
- Admins: read all

The `resume_url` column on `candidate_profiles` stores the storage path (e.g., `{user_id}/resume.pdf`), not the full public URL. Signed URLs are generated server-side when employers need to download resumes.

## What's Not Built (Intentional Omissions)

1. **Employer-to-candidate messaging**: Adds significant complexity (inbox UI, notifications, threading). Next step: integrate a tool like Knock or build a simple message model.
2. **Email notifications**: Auth emails are handled by Supabase. Application confirmation emails, employer notifications of new applicants, etc., are not implemented. Recommended: [Resend](https://resend.com) or [Postmark](https://postmarkapp.com) with webhook triggers or Supabase Edge Functions.
3. **Full applicant tracking**: Employers can mark applications as viewed/advanced/rejected, but there's no Kanban UI or email threading. This is MVP-sufficient.
4. **Resume download for employers**: The storage path is saved; generating signed URLs for employer resume downloads is a small additional step not yet wired to the UI.
5. **Team Pack**: Placeholder in pricing UI. Implemented as a "Contact us" CTA.
6. **Cron jobs for job expiry**: Jobs expire based on `expires_at` in the database (enforced by the `jobs_select_public` RLS policy: `expires_at > now()`). A cron job to SET status = 'expired' for aesthetic purposes (showing "Expired" in employer dashboard) is not yet implemented. Recommend Supabase Edge Functions with pg_cron.
