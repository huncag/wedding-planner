-- ============================================================================
-- RSVP per-person list
-- ----------------------------------------------------------------------------
-- Run once in the Supabase dashboard: Project → SQL Editor → paste → Run.
--
-- Adds a `people` column so guests can name every attendee and pick a meal for
-- each one. The app keeps working without it: until this runs, replies carry
-- the same list inside `plus_one_name` and the planner decodes it.
--
-- Safe to run more than once.
-- ============================================================================

alter table public.rsvp_submissions
  add column if not exists people jsonb;

comment on column public.rsvp_submissions.people is
  'Per-person list: [{"name": "...", "meal": "meat" | "vegetarian" | "vegan" | "kids"}].';
