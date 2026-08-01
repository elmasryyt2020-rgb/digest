-- Adds the `budget` column to `public.profiles` so the app can persist the
-- user's selected weekly grocery tier ('low' | 'medium' | 'high').
--
-- Without this column, every `profiles.upsert({ ..., budget })` from the mobile
-- client returns HTTP 400 ("column 'budget' of relation 'profiles' does not
-- exist"), which aborts the rest of `syncToSupabase` (including the meal_plans
-- write). Run this once in the Supabase dashboard SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS budget character varying(16)
  DEFAULT 'medium'
  CHECK (budget IN ('low', 'medium', 'high'));
