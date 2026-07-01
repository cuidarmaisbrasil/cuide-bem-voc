
ALTER TABLE public.wellness_invitations DROP CONSTRAINT IF EXISTS wellness_invitations_wave_check;
ALTER TABLE public.wellness_invitations ADD CONSTRAINT wellness_invitations_wave_check
  CHECK (wave = ANY (ARRAY['phq9','ecig','copsoq','psicossocial','assedio_sexual','phq9_retest']));

ALTER TABLE public.phq9_company_responses ADD COLUMN IF NOT EXISTS is_retest boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_phq9_company_responses_retest ON public.phq9_company_responses(company_id, round_no, is_retest);
