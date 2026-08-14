-- ============================================================================
-- Spotlit — Community (groups, posts, comments, moderation)
-- ============================================================================

-- ─── app_admins ──────────────────────────────────────────────────────────────
-- Platform-level moderators (you / your team), separate from per-group
-- moderators. Kept as its own tiny table rather than a role flag on profiles
-- so it's obvious and auditable who has cross-community moderation power.

create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create policy "admins can see the admin list"
  on public.app_admins for select
  to authenticated
  using (auth.uid() in (select user_id from public.app_admins));

-- No client-facing insert/update/delete policy: granting admin is a
-- service-role / dashboard operation, intentionally not self-serve.

create function public.is_app_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where user_id = uid);
$$;

-- ─── groups ──────────────────────────────────────────────────────────────────

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  focus_body_location text,
  -- References profiles (not auth.users) rather than auth.users so
  -- PostgREST can embed author display info in a single select — see
  -- posts/comments below for the same pattern. profiles.id == auth.users.id
  -- 1:1, created by the handle_new_user trigger at signup.
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "groups are readable by any authenticated user"
  on public.groups for select
  to authenticated
  using (true);

create policy "authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "group owners and admins can update a group"
  on public.groups for update
  to authenticated
  using (
    auth.uid() = created_by
    or public.is_app_admin(auth.uid())
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role in ('owner', 'moderator')
    )
  );

-- ─── group_members ───────────────────────────────────────────────────────────

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator', 'owner')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "membership rosters are readable by any authenticated user"
  on public.group_members for select
  to authenticated
  using (true);

create policy "users can join a group as themselves"
  on public.group_members for insert
  to authenticated
  with check (auth.uid() = user_id and role = 'member');

create policy "users can leave a group they belong to"
  on public.group_members for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "owners and admins can change member roles"
  on public.group_members for update
  to authenticated
  using (
    public.is_app_admin(auth.uid())
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
    )
  );

create function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members where group_id = gid and user_id = uid
  );
$$;

-- Auto-join the creator of a group as its owner.
create function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.group_members (group_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

-- ─── posts ───────────────────────────────────────────────────────────────────

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  body text not null,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_removed boolean not null default false,
  removed_reason text
);

create index posts_group_id_idx on public.posts (group_id, created_at desc);

alter table public.posts enable row level security;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

create policy "visible posts are readable by group members"
  on public.posts for select
  to authenticated
  using (
    (not is_removed or author_id = auth.uid() or public.is_app_admin(auth.uid()))
    and public.is_group_member(group_id, auth.uid())
  );

create policy "group members can post"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id and public.is_group_member(group_id, auth.uid()));

create policy "authors and moderators can edit a post"
  on public.posts for update
  to authenticated
  using (
    auth.uid() = author_id
    or public.is_app_admin(auth.uid())
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = posts.group_id and gm.user_id = auth.uid() and gm.role in ('owner', 'moderator')
    )
  );

create policy "authors can delete their own post"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id or public.is_app_admin(auth.uid()));

-- ─── comments ────────────────────────────────────────────────────────────────

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  is_removed boolean not null default false
);

create index comments_post_id_idx on public.comments (post_id, created_at asc);

alter table public.comments enable row level security;

create policy "visible comments are readable by group members"
  on public.comments for select
  to authenticated
  using (
    (not is_removed or author_id = auth.uid() or public.is_app_admin(auth.uid()))
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id and public.is_group_member(p.group_id, auth.uid())
    )
  );

create policy "group members can comment"
  on public.comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id and public.is_group_member(p.group_id, auth.uid())
    )
  );

create policy "authors and moderators can edit a comment"
  on public.comments for update
  to authenticated
  using (
    auth.uid() = author_id
    or public.is_app_admin(auth.uid())
    or exists (
      select 1 from public.posts p
      join public.group_members gm on gm.group_id = p.group_id
      where p.id = comments.post_id and gm.user_id = auth.uid() and gm.role in ('owner', 'moderator')
    )
  );

create policy "authors can delete their own comment"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id or public.is_app_admin(auth.uid()));

-- ─── reports ─────────────────────────────────────────────────────────────────
-- Any member can flag a post/comment. Reporters can see their own reports;
-- only admins/moderators can see the full queue (kept out of client RLS —
-- see docs/DATA_GOVERNANCE.md for the moderation workflow).

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id)
);

create index reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "users can file a report"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "reporters can see their own reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id or public.is_app_admin(auth.uid()));

create policy "admins can resolve reports"
  on public.reports for update
  to authenticated
  using (public.is_app_admin(auth.uid()));

-- Seed a default general-discussion group so the app has somewhere to post
-- from day one.
insert into public.groups (slug, name, description)
values ('general', 'General Discussion', 'Anything vitiligo-related that doesn''t fit elsewhere.');

-- Auto-join every new user to the general group so they land somewhere with
-- content instead of an empty community tab. Runs as a second trigger on the
-- same auth.users insert event that public.handle_new_user (migration 1)
-- already hooks.
create function public.handle_new_user_join_general()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  select id, new.id, 'member' from public.groups where slug = 'general'
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_join_general
  after insert on auth.users
  for each row execute procedure public.handle_new_user_join_general();
