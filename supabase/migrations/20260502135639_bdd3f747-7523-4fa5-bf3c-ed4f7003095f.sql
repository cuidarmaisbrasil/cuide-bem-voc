ALTER TABLE public.test_events
  ADD COLUMN IF NOT EXISTS phq9_answers integer[],
  ADD COLUMN IF NOT EXISTS functional_impact integer;