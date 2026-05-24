# Top25 Talent

Top25 Talent is a recruiting marketplace for verified students and alumni from the top 25 US universities. Employers post internships and full-time roles. Candidates verify their school affiliation via email OTP before applying. Every candidate has confirmed their school email — no resume spam, no unverified applicants.

Built by a UVA economics student as a solo MVP.

---

## Tech Stack

- **Frontend**: Next.js 14 App Router with TypeScript (strict mode)
- **Database / Auth / Storage**: Supabase (PostgreSQL + Row Level Security + Supabase Auth)
- **Payments**: Stripe Checkout (one-time payments) + webhook verification
- **Deployment**: Vercel
- **Styling**: Tailwind CSS + shadcn/ui (emerald accent, Inter font)
- **Auth**: Supabase Email OTP (6-digit code, no magic link required)

---

## 1. Local Setup

### Prerequisites

- **Node.js 20+** — download from [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)
- **Git**

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/top25-talent.git
cd top25-talent

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Fill in .env.local with your Supabase and Stripe credentials
# (See sections 2 and 3 below for how to get these values)

# 5. Start the development server
npm run dev
# Open http://localhost:3000
```

---

## 2. Supabase Setup (Step-by-Step)

### 2.1 Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project**.
3. Choose your organization, enter a project name (`top25-talent`), and set a database password (save this — you won't see it again).
4. Choose a region close to your users (US East for east coast targeting).
5. Click **Create new project**. It takes about 2 minutes to provision.

### 2.2 Get Your API Keys

Once your project is ready:

1. In the left sidebar, click **Settings** → **API**.
2. Copy **Project URL** → paste into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy **anon / public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy **service_role** key → paste as `SUPABASE_SERVICE_ROLE_KEY`.

⚠️ The **service_role** key bypasses Row Level Security. **Never commit it, never expose it to the browser.** It is only used in server-side code.

### 2.3 Run Database Migrations

You have two options:

**Option A — Supabase CLI (recommended)**

```bash
# Install Supabase CLI
brew install supabase/tap/supabase   # macOS
# OR: npm install -g supabase

# Log in
supabase login

# Link to your project (find your project ref in the dashboard URL:
# https://supabase.com/dashboard/project/<YOUR-PROJECT-REF>)
supabase link --project-ref YOUR-PROJECT-REF

# Push all migrations
supabase db push
```

**Option B — Paste into SQL Editor**

1. In Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/0001_init.sql`, copy all contents, paste into the editor, click **Run**.
4. Repeat for `0002_rls.sql` and `0003_seed.sql`.

### 2.4 Configure Auth

In the Supabase Dashboard:

1. Go to **Authentication** → **Providers** → **Email**.
2. Make sure **Email** is enabled.
3. **Disable** the "Confirm email" toggle — we use OTP instead of the confirmation link.
4. Set **OTP expiry** to `3600` (1 hour).
5. Click **Save**.

### 2.5 Configure Email Templates

In **Authentication** → **Email Templates**:

1. Click **OTP Email**.
2. Customize the subject and body. The OTP code variable is `{{ .Token }}`. Make it prominent:

```
Subject: Your Top25 Talent verification code: {{ .Token }}

Body:
Your verification code is:

{{ .Token }}

This code expires in 60 minutes. Enter it at https://top25talent.com/candidates/verify

If you didn't request this, you can safely ignore this email.
```

3. Click **Save**.

### 2.6 Configure Redirect URLs

In **Authentication** → **URL Configuration**:

1. Set **Site URL** to `http://localhost:3000` for local development.
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.vercel.app/auth/callback` (add this after first deploy)
3. Click **Save**.

### 2.7 Set Up Storage (Resume Bucket)

1. In the left sidebar, click **Storage**.
2. Click **New bucket**.
3. Name it `resumes`.
4. Make sure **Public bucket** is **OFF** (this should be private — only authenticated users access it).
5. Click **Create bucket**.
6. Click on the `resumes` bucket, then **Policies**.
7. Add a policy: authenticated users can upload to their own folder (`{auth_user_id}/*`).

You can use this SQL in the SQL Editor to set up storage policies:
```sql
-- Allow candidates to read and write their own resume
CREATE POLICY "Candidates can upload own resume"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Candidates can read own resume"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Candidates can delete own resume"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);
```

### 2.8 Create Your Admin Account

You need to make yourself an admin to access `/admin`.

1. Sign up through the app at `http://localhost:3000/candidates/signup` (use any email you control — doesn't need to be a school email for your own admin account, but you'll need to complete OTP).
2. After signing up, go to the Supabase Dashboard → **Authentication** → **Users**.
3. Find your user, copy the **UUID** (the `id` column).
4. Go to **SQL Editor**, run:

```sql
INSERT INTO admins (auth_user_id) VALUES ('paste-your-uuid-here');
```

You now have admin access at `http://localhost:3000/admin`.

---

## 3. Stripe Setup (Step-by-Step)

### 3.1 Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create a free account.
2. In the top-right corner, make sure the toggle says **Test mode** (not Live). Always develop in test mode.

### 3.2 Get Your API Keys

1. In Stripe Dashboard, go to **Developers** → **API keys**.
2. Copy the **Secret key** (starts with `sk_test_`).
3. Paste it into `.env.local` as `STRIPE_SECRET_KEY`.
4. Copy the **Publishable key** (starts with `pk_test_`) into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional, not currently used server-side but handy for future work).

### 3.3 Set Up Webhook for Local Development

When Stripe completes a payment, it sends a POST request to your webhook endpoint. For local development, you need the Stripe CLI to forward these events to your local server.

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe   # macOS
# Windows: https://stripe.com/docs/stripe-cli#install

# Log in to Stripe
stripe login

# In a new terminal tab, start forwarding webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print something like:
```
> Ready! Your webhook signing secret is whsec_abc123xyz...
```

Copy that `whsec_...` value into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

**Keep the `stripe listen` terminal running while you develop** — it must be active for payment testing to work.

### 3.4 Set Up Webhook for Production

After deploying to Vercel:

1. In Stripe Dashboard → **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Events to listen to: select `checkout.session.completed`.
5. Click **Add endpoint**.
6. On the webhook detail page, click **Reveal** next to **Signing secret**.
7. Copy the `whsec_...` value and add it to Vercel's environment variables as `STRIPE_WEBHOOK_SECRET`.

### 3.5 Test Cards

Use these test card numbers — no real charges are made in test mode:

| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 9995` | Payment is declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

- Expiry: any future date (e.g., `12/28`)
- CVC: any 3 digits (e.g., `123`)
- ZIP: any 5 digits (e.g., `10001`)

---

## 4. Vercel Deployment

### 4.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/top25-talent.git
git push -u origin main
```

### 4.2 Import in Vercel

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New** → **Project**.
3. Connect your GitHub account if prompted.
4. Select your `top25-talent` repository.
5. Vercel auto-detects Next.js — no framework config needed.
6. Click **Deploy** (it will fail without env vars — that's OK, add them next).

### 4.3 Add Environment Variables

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | ⚠️ Mark as **Sensitive** |
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for staging) | ⚠️ Sensitive |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from production webhook | ⚠️ Sensitive |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Safe to expose |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Used for absolute URLs |

Click **Save** and trigger a new deployment.

### 4.4 Update Supabase and Stripe After First Deploy

1. **Supabase Site URL**: Authentication → URL Configuration → update Site URL to `https://your-domain.vercel.app`. Add `https://your-domain.vercel.app/auth/callback` to Redirect URLs.
2. **Stripe webhook**: Update the webhook endpoint URL to point to your Vercel domain (see Section 3.4).

### 4.5 Custom Domain (Optional)

In Vercel → **Domains**, add your custom domain and follow the DNS configuration instructions.

---

## 5. Test Flows

After setup, verify these four flows work end-to-end:

### Flow 1: Candidate — Auto-verified Student

1. Go to `/candidates/signup`.
2. Enter a name, select UVA, use `test@virginia.edu` (or any real virginia.edu address you control).
3. Submit — you should get "Sending code..." then redirect to `/candidates/verify`.
4. Check your email for the 6-digit OTP.
5. Enter the OTP → redirected to `/dashboard/candidate`.
6. Profile should show "Verified Student" badge.

### Flow 2: Candidate — Manual Review

1. Go to `/candidates/signup`.
2. Use an email whose domain is not in `allowed_domains` (e.g., `test@gmail.com` with any school selected).
3. The OTP still sends (to confirm inbox ownership), but after verification, status is `manual_review`.
4. Go to `/admin/review` — the candidate appears for review.
5. Click **Approve** → status becomes `verified_alumni`.

### Flow 3: Employer — Post and Pay

1. Go to `/employers/signup`.
2. Enter company name and work email, verify OTP.
3. Dashboard at `/dashboard/employer` → click **Post a job**.
4. Fill in job details, submit → redirected to checkout.
5. Select a pricing tier → redirected to Stripe Checkout.
6. Use test card `4242 4242 4242 4242` → complete payment.
7. Stripe webhook fires → job `status` becomes `active`.
8. Job appears on `/jobs` board immediately.

### Flow 4: Admin — Review and Feature

1. Log in with your admin account.
2. Go to `/admin/review` — approve or reject manual_review candidates.
3. Go to `/admin/jobs` — feature or archive any job.
4. Go to `/admin/payments` — review all transactions.

---

## 6. Promoting Yourself to Admin

1. Sign up at `/candidates/signup` or `/employers/signup` with any email you control.
2. In Supabase Dashboard → **Authentication** → **Users**, find your user UUID.
3. Run in SQL Editor:
```sql
INSERT INTO admins (auth_user_id) VALUES ('your-uuid-here');
```
4. Visit `/admin` — you should have full access.

---

## 7. Project Structure

```
top25-talent/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (font, theme, header, footer)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Tailwind base + CSS variables
│   ├── jobs/
│   │   ├── page.tsx              # Public jobs board with filters
│   │   └── [slug]/
│   │       ├── page.tsx          # Job detail + apply button
│   │       └── apply-button.tsx  # Client apply component
│   ├── candidates/
│   │   ├── signup/
│   │   │   ├── page.tsx          # Signup form (client)
│   │   │   └── actions.ts        # Server action: domain check + OTP send
│   │   └── verify/
│   │       └── page.tsx          # OTP entry (client)
│   ├── employers/
│   │   ├── signup/page.tsx       # Employer signup
│   │   └── verify/page.tsx       # OTP entry
│   ├── dashboard/
│   │   ├── candidate/            # Candidate dashboard (profile, resume, jobs)
│   │   └── employer/             # Employer dashboard (job CRUD, applicants)
│   ├── admin/                    # Admin panel (auth-guarded)
│   │   ├── layout.tsx            # Admin sidebar layout
│   │   ├── review/               # Manual review queue
│   │   ├── schools/              # School management
│   │   ├── domains/              # Domain management
│   │   ├── employers/            # Employer management
│   │   ├── jobs/                 # Job management
│   │   └── payments/             # Payment history
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts # Creates Stripe Checkout Session
│   │   │   └── webhook/route.ts  # Activates jobs after payment
│   │   └── candidates/
│   │       └── finalize/route.ts # Upserts candidate profile after OTP
│   └── auth/callback/route.ts    # Magic link fallback handler
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── header.tsx                # Site header (server component)
│   ├── footer.tsx                # Site footer
│   ├── theme-provider.tsx        # next-themes wrapper
│   ├── theme-toggle.tsx          # Dark/light toggle
│   ├── job-card.tsx              # Job listing card
│   ├── job-filters.tsx           # Jobs board filter bar (client)
│   ├── verification-badge.tsx    # Status pill component
│   ├── otp-input.tsx             # 6-digit OTP input (client)
│   └── pricing-cards.tsx         # Pricing tier cards
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # Server-side Supabase client (cookies)
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── admin.ts              # Service role client (server-only)
│   │   ├── middleware.ts         # Session refresh utility
│   │   └── types.ts              # Full TypeScript types for DB schema
│   ├── stripe.ts                 # Stripe client + pricing config
│   ├── domain-check.ts           # Server-side domain verification logic
│   ├── auth.ts                   # Auth helpers (requireUser, requireAdmin, etc.)
│   ├── schemas.ts                # Zod schemas for all forms
│   └── utils.ts                  # cn(), slugify(), formatCurrency(), etc.
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql         # Tables, enums, indexes, triggers
│   │   ├── 0002_rls.sql          # Row Level Security policies
│   │   └── 0003_seed.sql         # Schools, domains, jobs seed data
│   └── config.toml               # Supabase CLI config
├── scripts/
│   └── seed-auth.ts              # Creates auth users + profiles (run manually)
├── middleware.ts                 # Session refresh + admin/dashboard guards
├── .env.example                  # Template for environment variables
├── package.json
├── tsconfig.json                 # Strict TypeScript
├── tailwind.config.ts            # Tailwind config with shadcn tokens
├── next.config.js
└── README.md                     # This file
```

---

## 8. Common Issues

### OTP Email Not Arriving

1. Check your spam/junk folder.
2. In Supabase Dashboard → **Authentication** → **Logs**, look for email send events.
3. For development: Supabase has rate limits on emails for free accounts. If you're testing repeatedly, wait a few minutes or use the Supabase local emulator.
4. Make sure you disabled "Confirm email" in Auth settings (we use OTP, not email confirmation link).

### Stripe Webhook Returns 400

1. Make sure `STRIPE_WEBHOOK_SECRET` matches the webhook's signing secret.
2. For local dev: make sure `stripe listen` is running and you're using the secret it printed (starts with `whsec_`).
3. Check that you're reading the raw body with `await request.text()` before parsing — do NOT use `await request.json()` in the webhook handler.
4. Check Stripe Dashboard → **Developers** → **Webhooks** → click your endpoint → **Logs** for specific error messages.

### RLS Blocking Expected Queries

1. Check the Supabase SQL Editor by running the query directly.
2. To debug as a specific user: use `SET LOCAL request.jwt.claim.sub = 'user-uuid';` in a SQL transaction.
3. Common cause: candidate's `is_searchable` is `false` — only set to `true` after OTP verification succeeds.
4. Check `verification_events` table for logs of what happened during signup.

### `SUPABASE_SERVICE_ROLE_KEY` Exposed in Client Bundle

This should never happen because:
- `lib/supabase/admin.ts` has `import 'server-only'` at the top.
- If you accidentally import it from a Client Component, Next.js will throw a build error.
- Double-check by running `npm run build` and inspecting the output.

### Jobs Not Appearing on Jobs Board After Payment

1. Check the Stripe webhook fired: Stripe Dashboard → **Developers** → **Webhooks** → your endpoint → **Logs**.
2. Check the `payments` table in Supabase for the transaction.
3. Check the `jobs` table — `status` should be `active`, `expires_at` should be in the future.
4. RLS: `jobs_select_public` policy requires `status = 'active' AND expires_at > now()`. If `expires_at` is in the past, the job won't appear.

---

## 9. Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (⚠️ server-only) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_... or sk_live_...) | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Optional |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (http://localhost:3000 or production URL) | Yes |
