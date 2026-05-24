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
