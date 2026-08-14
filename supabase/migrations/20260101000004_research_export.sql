-- ============================================================================
-- Spotlit — De-identified research export
-- ============================================================================
-- This view is the ONLY sanctioned way research/partner data ever leaves the
-- product. It is intentionally:
--
--   1. Opt-in only — joins through current_consent and drops any user whose
--      latest decision is research_opt_in = false.
--   2. Pseudonymous — joined via research_subject_codes.subject_code, never
--      the user's auth id, email, or display name.
--   3. Minimum-necessary — no free-text notes, no photos, no patch/user
--      names, no absolute calendar dates (dates are one of the HIPAA Safe
--      Harbor "18 identifiers"; day_number/target_days give a research
--      partner the relative timeline they need — day 1, day 14, day 60 —
--      without exposing when in the world it happened).
--   4. NOT reachable by the anon/authenticated Postgres roles the mobile app
--      uses. It is only queryable with the service_role key (or a dedicated
--      read-only research role you provision per partner under a signed data
--      use agreement) — see docs/DATA_GOVERNANCE.md for the export workflow.
--
-- Adjust column selection here to match a specific partner's approved data
-- spec once you have one; keep this comment block in sync with whatever you
-- change.
-- ============================================================================

create view public.research_export_v1
with (security_invoker = false)
as
select
  rsc.subject_code,
  p.body_location,
  p.stressor,
  p.cause,
  p.medication,
  p.target_days,
  p.is_active,
  dl.day_number,
  dl.ointment_applied,
  dl.ointment_name,
  dl.progress
from public.daily_logs dl
join public.patches p on p.id = dl.patch_id
join public.research_subject_codes rsc on rsc.user_id = p.user_id
join public.current_consent cc on cc.user_id = p.user_id
where cc.research_opt_in = true;

revoke all on public.research_export_v1 from public, anon, authenticated;

comment on view public.research_export_v1 is
  'De-identified, opt-in-only research export. Access via service_role key or a partner-specific read-only role only — never expose to anon/authenticated. See docs/DATA_GOVERNANCE.md.';
