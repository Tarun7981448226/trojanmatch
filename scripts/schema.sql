-- Trojan JobMatch database schema (Postgres / Neon).
-- Run once on a new database: ./scripts/setup_db.sh
-- Then load jobs and run: npx tsx --env-file=.env.local scripts/classify_jobs.ts

-- Job postings (the shared feed). Filled from public job sources.
create table if not exists jobs (
  id          serial primary key,
  company     text not null,
  role        text not null,
  location    text,
  type        text,
  skills      jsonb,
  keywords    jsonb,
  visa_notes  text,
  jd_text     text,
  apply_url   text,
  source      text not null default 'manual',
  posted_date date,
  created_at  timestamptz not null default now(),
  tm_domain   text,   -- set by scripts/classify_jobs.ts
  tm_level    text,   -- student | general | experienced
  tm_type     text    -- internship | new_grad | full_time | contract | part_time
);

create table if not exists tm_users (
  id            bigserial primary key,
  email         text not null unique,
  name          text not null,
  phone         text,
  password_hash text,                       -- bcrypt; null for Google-only accounts
  google_sub    text unique,
  skills        text[] not null default '{}',
  department    text,
  photo         text,                       -- small JPEG data URL
  created_at    timestamptz not null default now()
);

create table if not exists tm_password_resets (
  token_hash text primary key,              -- SHA-256 of the emailed token
  user_id    bigint not null references tm_users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz
);

create table if not exists tm_decisions (
  user_id    bigint not null references tm_users(id) on delete cascade,
  job_id     integer not null references jobs(id) on delete cascade,
  decision   text not null check (decision in ('saved', 'applied', 'not_interested')),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- One private resume per user.
create table if not exists tm_resumes (
  user_id     bigint primary key references tm_users(id) on delete cascade,
  file_name   text not null,
  mime        text not null,
  file        bytea not null,
  text        text not null default '',
  profile     jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

-- Cached AI analysis per user and job (cleared when the resume changes).
create table if not exists tm_analyses (
  user_id    bigint not null references tm_users(id) on delete cascade,
  job_id     integer not null references jobs(id) on delete cascade,
  result     jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- Resume builder drafts.
create table if not exists tm_resume_drafts (
  user_id    bigint primary key references tm_users(id) on delete cascade,
  style      text not null default 'jake',
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Email verification codes for @usc.edu sign-up (hashed, short-lived).
create table if not exists tm_email_codes (
  email      text primary key,
  code_hash  text not null,
  attempts   integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz
);

-- "Check a job": one row per job a student checks. Private per user.
create table if not exists tm_checks (
  id         bigserial primary key,
  user_id    bigint not null references tm_users(id) on delete cascade,
  title      text not null default '',
  company    text not null default '',
  job_text   text not null,
  analysis   jsonb,
  questions  jsonb,
  answers    jsonb,
  tailored   jsonb,
  coach      jsonb,
  created_at timestamptz not null default now()
);
create index if not exists tm_checks_user_idx on tm_checks (user_id, created_at desc);
