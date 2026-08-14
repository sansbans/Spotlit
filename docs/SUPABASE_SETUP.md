# Supabase Setup

Spotlit needs a Supabase project for auth, the Postgres database, and file
storage. This is a one-time setup per environment (dev/staging/prod).

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon/public API key**
   (Project Settings → API) — you'll need these in step 4.

## 2. Run the migrations

The schema lives in `supabase/migrations/`, applied in filename order:

1. `20260101000001_profiles_and_consent.sql` — profiles, research consent ledger
2. `20260101000002_patches_and_logs.sql` — private tracking data
3. `20260101000003_community.sql` — groups, posts, comments, moderation
4. `20260101000004_research_export.sql` — de-identified research view
5. `20260101000005_storage.sql` — storage buckets and policies

**Option A — Supabase CLI (recommended):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — SQL editor:** open each file in this order in the Supabase
dashboard's SQL editor and run it.

Re-running is not idempotent by default (tables/policies will error if they
already exist) — for a fresh project this doesn't matter; for iterating on
the schema later, write a new migration file rather than editing an applied
one.

## 3. Configure auth

In **Authentication → Providers → Email**:

- Decide whether to require email confirmation before first sign-in
  (recommended for production; the app already handles both cases — see
  `app/(auth)/sign-up.tsx`).
- Consider a minimum password length matching what the sign-up form
  enforces (8 characters).

## 4. Set app environment variables

```bash
cp .env.example .env
```

Fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Restart `expo start` after editing `.env` — Expo only reads
`EXPO_PUBLIC_*` vars at bundler startup.

**Never** put the `service_role` key behind an `EXPO_PUBLIC_` prefix or
anywhere in the mobile app bundle — it bypasses Row Level Security entirely
and must only ever live server-side (e.g. in a future export job — see
`docs/DATA_GOVERNANCE.md` §4).

## 5. Verify storage buckets

Migration `20260101000005_storage.sql` creates three buckets:

- `patch-photos` (private) — personal tracking photos
- `post-images` (private, readable by any authenticated user) — community post images
- `avatars` (public) — profile pictures

Check **Storage** in the dashboard to confirm all three exist with the
policies applied (Storage → a bucket → Policies).

## 6. Grant yourself app_admin (optional, for moderation)

There's no self-serve way to become a platform moderator (by design — see
`docs/DATA_GOVERNANCE.md` §5). Run this once in the SQL editor with your own
user id (find it in Authentication → Users):

```sql
insert into public.app_admins (user_id) values ('<your-auth-user-id>');
```

## 7. Smoke test

1. `npm start`, run the app, sign up a test account.
2. Confirm you land on the research-consent screen, then the tabs.
3. Create a patch with a photo, log a day — confirm the photo shows up
   (this round-trips through Supabase Storage, so it needs network).
4. Open the Community tab, join "General Discussion", create a post with a
   photo, add a comment.
5. In Settings, toggle research data sharing on/off and confirm it sticks
   after restarting the app.
6. In the SQL editor, spot-check `select * from research_export_v1;` (run
   this as the project owner in the SQL editor, which uses elevated
   privileges — it will not work from the app's anon/authenticated role by
   design) after opting a test account in, to confirm de-identified rows
   appear.
