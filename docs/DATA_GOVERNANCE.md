# Spotlit — Data Governance

This document explains how Spotlit handles personal tracking data, research
data sharing, and community content. It's written so you (the founder), a
future research partner's IRB, and a reviewer at Apple can all read the same
source of truth. Keep it in sync with the actual schema in
`supabase/migrations/`.

## 1. Three tiers of data

| Tier | Examples | Who can see it | Where |
|---|---|---|---|
| **Private tracking data** | Patch name, photos, ointment notes, free-text notes | Only the owning user | `patches`, `daily_logs`, `patch-photos` storage bucket |
| **Community content** | Posts, comments, group membership | Any authenticated member of the group | `posts`, `comments`, `group_members`, `post-images` storage bucket |
| **Research export** | De-identified structured fields (see §3) | Only via `service_role` key / a partner-specific read-only DB role, under a signed data-use agreement — never the mobile app | `research_export_v1` view |

Nothing crosses from tier 1 or 2 into tier 3 except through the explicit,
opt-in consent flow described below.

## 2. Consent flow

- On first login, every user sees `app/consent.tsx`: a plain-language
  explanation of what research sharing means, **defaulting to off**.
- Their decision is written to `consent_records`, an **append-only ledger**
  (see `supabase/migrations/20260101000001_profiles_and_consent.sql`) —
  every opt-in/opt-out is a new timestamped row tied to the exact policy
  text version (`policy_version`) they were shown. Nothing is ever
  overwritten, so there's always a defensible audit trail of what a user
  agreed to and when.
- `current_consent` (a view over the latest row per user) is what the app
  and the export pipeline actually read.
- Users can change their choice anytime from **Settings → Research Data
  Sharing**. Turning it off takes effect on the *next* export run — it
  can't retroactively pull back data already delivered to a partner under a
  signed agreement, the same way a letter can't be unsent. Say this
  explicitly in the in-app copy (already done in `src/constants/consent.ts`)
  and in any partner agreement.
- **Bump `RESEARCH_POLICY_VERSION`** in `src/constants/consent.ts` any time
  the policy text changes materially. Existing consent rows keep referencing
  the version they were actually shown; a new version does **not**
  automatically re-opt-in users — a real product decision (re-prompt vs.
  treat as still-valid) belongs to you and whoever is running the research
  partnership at the time.

## 3. De-identification

`research_export_v1` (`supabase/migrations/20260101000004_research_export.sql`)
is the *only* sanctioned path for data to leave the product for research. It:

1. **Only includes opted-in users** — joins through `current_consent` and
   drops anyone whose latest decision is `research_opt_in = false`.
2. **Is pseudonymous** — joined via `research_subject_codes.subject_code`, a
   random UUID generated at signup, never the user's auth id, email, or
   display name.
3. **Excludes free text and photos** — no notes, no `cause` field (which is
   often a short free-text history), no images. Only structured, coded
   fields: `body_location`, `stressor`, `medication`, `target_days`,
   `day_number`, `ointment_applied`, `ointment_name`, `progress`.
4. **Excludes absolute dates** — calendar dates are one of the HIPAA Safe
   Harbor "18 identifiers." The export uses `day_number` (days since the
   patch's start date) instead of `date`/`start_date`, giving a research
   partner the relative timeline they need without exposing *when* in the
   world it happened.
5. **Is not reachable by the app's normal database roles.** The view is
   revoked from `anon`/`authenticated`; only the `service_role` key (used
   server-side, never shipped in the app) or a dedicated read-only Postgres
   role you provision per partner can query it.

**Before connecting a real research partner**, update the column list in
that view to match their approved data spec / IRB protocol, and keep the
comment block in the migration in sync with whatever you change. If a
partner needs `cause` or other free-text fields, that's a materially
different risk profile (re-identification risk, need for manual PII review)
and should go through your own legal/privacy review first — don't just
add the column.

## 4. Export workflow (once you have a real partner)

This repo does **not** include an automated export job — building one is a
deliberate choice you make once a partner/IRB relationship exists, so you
control cadence, format, and delivery. Suggested shape:

1. Provision a Postgres role scoped to `select` on `research_export_v1`
   only (or use the `service_role` key from a server you control — never
   embed it in the mobile app).
2. Run the export on a schedule (e.g. a small server-side job, or Supabase's
   scheduled Edge Functions) into whatever format/delivery mechanism the
   data-use agreement specifies (SFTP, a shared warehouse, etc.).
3. Log each export run (who ran it, when, row count) somewhere durable —
   IRBs and partners will ask for this.

## 5. Community moderation

- `reports` lets any member flag a post/comment with a reason. Reporters can
  see their own reports; only `app_admins` can see the full queue (kept
  deliberately out of client RLS for now — there's no in-app moderation
  dashboard yet).
- Per-group `owner`/`moderator` roles (`group_members.role`) can remove
  content within their own group (`posts.is_removed` /
  `comments.is_removed`) without deleting it outright, preserving a record
  for abuse investigation.
- `app_admins` is a small table you populate manually (via the Supabase
  dashboard SQL editor, not self-serve) for platform-wide moderators.
- There is currently no in-app moderation queue UI — resolving reports means
  querying `reports`/`posts`/`comments` directly in the Supabase dashboard.
  Build a real moderation screen before the community grows past what you
  can manually monitor.

## 6. App Store / privacy considerations

- Spotlit collects health-adjacent data (skin condition photos, treatment
  info). Apple's App Store Review Guidelines (§5.1.1) require clear
  disclosure and consent before collecting health data, and the app's
  **App Privacy** nutrition label must accurately reflect: photos, health
  info, and (once research sharing ships) data used for "Other Usage
  Purposes" / shared with third parties, scoped to only the opted-in
  population.
- Because research sharing is opt-in and off by default, the *base* app
  functionality (private tracking) should be described separately from the
  optional research contribution in both the App Privacy label and any
  privacy policy page you publish.
- This repo does not yet include a public privacy policy page/URL, which
  Apple requires at submission. Write one that matches this document before
  submitting to App Review.
- No HealthKit integration exists yet; if you add one later, it brings its
  own additional Apple review requirements (§5.1.1(x)) on top of everything
  here.

## 7. What this is not (yet)

This is a v1 foundation, deliberately scoped to be honest about where it
stops:

- No formal IRB approval or signed research partner — the schema and
  consent flow are built to make that easy to plug in, not to claim it
  already exists.
- No automated export pipeline (see §4).
- No in-app moderation dashboard (see §5).
- No data deletion/export self-service beyond "Clear All Data" in Settings
  (which deletes tracking data but does not affect data already delivered
  to a research partner under a prior export — see §2 on withdrawal).
- No offline support — the app now requires network connectivity for all
  tracking and community features (this replaced the previous
  local-only/AsyncStorage version).

Treat this document as living — update it whenever the schema, consent
copy, or moderation workflow changes.
