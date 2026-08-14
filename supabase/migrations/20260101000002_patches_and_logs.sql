-- ============================================================================
-- Spotlit — Patch tracking (personal data, private by default)
-- ============================================================================
-- patches/daily_logs are the user's own private tracking data. They are only
-- ever visible to the owning user via RLS. The research export pipeline
-- (0004) reads from these tables through a security-definer view scoped to
-- users who have actively opted in — it does not change these policies.
-- ============================================================================

create table public.patches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  body_location text not null,
  cover_photo_path text,
  stressor text,
  cause text,
  medication text,
  start_date date not null,
  target_days integer not null default 60,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patches_user_id_idx on public.patches (user_id);

alter table public.patches enable row level security;

create policy "users manage their own patches"
  on public.patches for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patches_set_updated_at
  before update on public.patches
  for each row execute procedure public.set_updated_at();

-- ─── daily_logs ──────────────────────────────────────────────────────────────
-- user_id is denormalized onto the row (not just derivable via patch_id) so
-- RLS can check ownership with a single column comparison. The WITH CHECK
-- clauses on insert/update additionally verify the referenced patch actually
-- belongs to the same user, so a user can't attach a log to someone else's
-- patch while claiming it as their own.

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references public.patches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  photo_path text,
  ointment_applied boolean not null default false,
  ointment_name text,
  application_time time,
  notes text,
  day_number integer not null,
  progress text not null check (progress in ('improving', 'same', 'worsening')),
  created_at timestamptz not null default now(),
  unique (patch_id, date)
);

create index daily_logs_user_id_idx on public.daily_logs (user_id);
create index daily_logs_patch_id_idx on public.daily_logs (patch_id);

alter table public.daily_logs enable row level security;

create policy "users can view their own logs"
  on public.daily_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert logs on their own patches"
  on public.daily_logs for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.patches p
      where p.id = daily_logs.patch_id and p.user_id = auth.uid()
    )
  );

create policy "users can update their own logs"
  on public.daily_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.patches p
      where p.id = daily_logs.patch_id and p.user_id = auth.uid()
    )
  );

create policy "users can delete their own logs"
  on public.daily_logs for delete
  to authenticated
  using (auth.uid() = user_id);
