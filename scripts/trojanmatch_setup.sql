-- TrojanMatch database setup. Run ONLY against the TrojanMatch Neon branch,
-- never SKYNET's production database (it deletes Tarun's private data).
--   psql "$TROJANMATCH_DATABASE_URL" -f scripts/trojanmatch_setup.sql
-- Safe to run twice.

-- 1. Remove Tarun's personal data copied over when the branch was made.
--    The public job postings in `jobs` stay as the shared feed.
do $$
begin
  if to_regclass('tailored_resumes') is not null then truncate tailored_resumes cascade; end if;
  if to_regclass('fit_scores') is not null then truncate fit_scores cascade; end if;
  if to_regclass('link_resume_requests') is not null then truncate link_resume_requests cascade; end if;
  if to_regclass('push_subscriptions') is not null then truncate push_subscriptions cascade; end if;
  if to_regclass('webauthn_credentials') is not null then truncate webauthn_credentials cascade; end if;
  if to_regclass('share_bot_inbox') is not null then truncate share_bot_inbox cascade; end if;
end $$;

update jobs set user_decision = null, notes = null, resume_version = null, resume_file = null, applied_date = null;

-- 2. Accounts. Passwords are stored only as bcrypt hashes; Google users
--    have no password at all.
create table if not exists tm_users (
  id            bigserial primary key,
  email         text not null unique,          -- always stored lower-case
  name          text not null,
  phone         text,                          -- optional, kept for future text alerts
  password_hash text,                          -- bcrypt; null for Google-only accounts
  google_sub    text unique,                   -- Google account id when signed in with Google
  skills        text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- 3. Password reset links: only a SHA-256 hash of the token is stored, and
--    each link expires after 30 minutes and works once.
create table if not exists tm_password_resets (
  token_hash text primary key,
  user_id    bigint not null references tm_users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz
);

-- 4. Each user's own decisions on the shared job feed.
create table if not exists tm_decisions (
  user_id    bigint not null references tm_users(id) on delete cascade,
  job_id     integer not null references jobs(id) on delete cascade,
  decision   text not null check (decision in ('saved', 'applied', 'not_interested')),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
