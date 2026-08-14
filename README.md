# Spotlit

A community app for people tracking vitiligo — private patch/treatment
tracking with photo timelapses, a community of groups/posts/comments, and an
optional, opt-in way to contribute de-identified data to vitiligo research.

Built with Expo (React Native) + Supabase (Postgres, Auth, Storage).

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project values — see docs/SUPABASE_SETUP.md
npm start
```

You'll need a Supabase project with the schema in `supabase/migrations/`
applied — full walkthrough in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

## What's in here

- **Private tracking** — patches, daily photo logs, streaks, timelapse
  playback (`app/(tabs)/index.tsx`, `patches.tsx`, `timelapse.tsx`,
  `app/patch/`, `app/log/`).
- **Auth** — email/password via Supabase Auth (`app/(auth)/`,
  `src/context/AuthContext.tsx`).
- **Research consent** — an explicit, off-by-default opt-in with a
  versioned, append-only consent ledger (`app/consent.tsx`,
  `src/context/ConsentContext.tsx`, `src/constants/consent.ts`).
- **Community** — groups, posts, comments, reporting
  (`app/(tabs)/community.tsx`, `app/community/`).
- **Data governance** — how research data is de-identified, who can access
  it, and what this app does *not* yet do — see
  [`docs/DATA_GOVERNANCE.md`](docs/DATA_GOVERNANCE.md). Read this before
  connecting a real research partner or submitting to App Review.

## Project structure

```
app/                  expo-router screens
  (auth)/              sign-in / sign-up
  (tabs)/               home, patches, timelapse, community, settings
  patch/, log/           patch detail/creation, daily log
  community/            group feed, post detail, new post/group
  consent.tsx           research data-sharing consent
src/
  context/               Auth / Consent / Patch React contexts
  utils/                 Supabase-backed data access (supabaseStorage,
                          communityStorage, photoStorage) + date helpers
  lib/supabase.ts        Supabase client
  components/             shared UI (PatchCard, PhotoCapture, TimeLapsePlayer, …)
  constants/              theme, consent policy text
  types/                  shared TypeScript types
supabase/migrations/    SQL schema, RLS policies, research export view
docs/                   setup + data governance docs
```
