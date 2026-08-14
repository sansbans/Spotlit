-- ============================================================================
-- Spotlit — Profiles & Research Consent
-- ============================================================================
-- Design goals:
--   1. Identity (profiles) is kept separate from research data (patches/logs)
--      wherever possible, so the export pipeline in 0004 can join through a
--      pseudonymous subject_code instead of the user's real id.
--   2. consent_records is an append-only ledger, not a row you update in
--      place. Every opt-in / opt-out is a new row with a timestamp, so there
--      is always a defensible audit trail of what a user agreed to and when
--      (a common IRB/research-partner requirement). "Current status" is
--      derived from the most recent row — see current_consent view below.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per auth user. Display name is public within the community; it is
-- deliberately NOT reused as the research subject identifier.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── research_subject_codes ─────────────────────────────────────────────────
-- A stable, random, non-guessable code per user used ONLY for research
-- export joins (0004). It is system-generated (via the trigger below), never
-- client-writable, so a user can't forge or swap another user's code.

create table public.research_subject_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subject_code uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

alter table public.research_subject_codes enable row level security;

create policy "users can view their own subject code"
  on public.research_subject_codes for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policies for regular users — rows are created only
-- by the handle_new_user trigger (security definer, runs as table owner).

-- ─── new-user bootstrap ─────────────────────────────────────────────────────
-- On signup, create a profile row (display name defaults to whatever was
-- passed in auth signup metadata, falling back to "Member") and a research
-- subject code. Runs with definer rights so it can bypass the RLS policies
-- above without needing a service-role key from the client.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Member')
  );

  insert into public.research_subject_codes (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── consent_records ─────────────────────────────────────────────────────────
-- Append-only ledger of research data-sharing consent decisions.
--   policy_version  — identifies which version of the research data-use
--                      policy the user was shown (bump this whenever the
--                      policy text changes materially; old rows keep
--                      referencing the version they were shown, which is
--                      important for audit purposes).
--   research_opt_in — true = "share my de-identified data for research" at
--                      the time of this record; false = withdrawal.

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  policy_version text not null,
  research_opt_in boolean not null,
  consented_at timestamptz not null default now()
);

create index consent_records_user_id_idx on public.consent_records (user_id, consented_at desc);

alter table public.consent_records enable row level security;

create policy "users can view their own consent history"
  on public.consent_records for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can record their own consent decisions"
  on public.consent_records for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Deliberately no update/delete policy: the ledger is immutable. Withdrawing
-- consent is done by inserting a new row with research_opt_in = false.

-- ─── current_consent ─────────────────────────────────────────────────────────
-- Convenience view: each user's latest consent decision.

create view public.current_consent
with (security_invoker = true)
as
select distinct on (user_id)
  user_id,
  policy_version,
  research_opt_in,
  consented_at
from public.consent_records
order by user_id, consented_at desc;
