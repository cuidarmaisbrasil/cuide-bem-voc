-- ============================================================
-- Wellness rounds (rodadas de rastreio) + devolutiva gate
-- ============================================================

-- 1. wellness_company_rounds: 1 row per (company, round_no)
CREATE TABLE IF NOT EXISTS public.wellness_company_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_no INT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ NULL,
  devolutiva_communicated_at TIMESTAMPTZ NULL,
  devolutiva_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, round_no)
);

GRANT SELECT, INSERT, UPDATE ON public.wellness_company_rounds TO authenticated;
GRANT ALL ON public.wellness_company_rounds TO service_role;

ALTER TABLE public.wellness_company_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all rounds"
  ON public.wellness_company_rounds
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owners view their rounds"
  ON public.wellness_company_rounds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = wellness_company_rounds.company_id
              AND c.owner_user_id = auth.uid())
  );

CREATE TRIGGER set_wellness_company_rounds_updated_at
BEFORE UPDATE ON public.wellness_company_rounds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. add round_no column to invitations + relax unique constraint
ALTER TABLE public.wellness_invitations
  ADD COLUMN IF NOT EXISTS round_no INT NOT NULL DEFAULT 1;

-- Drop old unique constraint if present, add new one including round_no
DO $$
DECLARE constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.wellness_invitations'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(participant_id, wave)%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.wellness_invitations DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.wellness_invitations
  ADD CONSTRAINT wellness_invitations_participant_wave_round_key
  UNIQUE (participant_id, wave, round_no);

CREATE INDEX IF NOT EXISTS idx_wellness_invitations_round_no
  ON public.wellness_invitations(round_no);

-- 3. add round_no to response tables so reports can be sliced per round
ALTER TABLE public.copsoq_responses
  ADD COLUMN IF NOT EXISTS round_no INT NULL;
ALTER TABLE public.phq9_company_responses
  ADD COLUMN IF NOT EXISTS round_no INT NULL;
ALTER TABLE public.ecig_responses
  ADD COLUMN IF NOT EXISTS round_no INT NULL;
ALTER TABLE public.psicossocial_responses
  ADD COLUMN IF NOT EXISTS round_no INT NULL;

CREATE INDEX IF NOT EXISTS idx_copsoq_responses_company_round
  ON public.copsoq_responses(company_id, round_no);
CREATE INDEX IF NOT EXISTS idx_phq9_responses_company_round
  ON public.phq9_company_responses(company_id, round_no);
CREATE INDEX IF NOT EXISTS idx_ecig_responses_company_round
  ON public.ecig_responses(company_id, round_no);
CREATE INDEX IF NOT EXISTS idx_psicossocial_responses_company_round
  ON public.psicossocial_responses(company_id, round_no);

-- 4. backfill: every existing company that has at least one invitation
--    gets a round 1 record (open, no devolutiva).
INSERT INTO public.wellness_company_rounds (company_id, round_no, opened_at)
SELECT DISTINCT wp.company_id, 1, COALESCE(MIN(wi.created_at), now())
FROM public.wellness_invitations wi
JOIN public.wellness_participants wp ON wp.id = wi.participant_id
GROUP BY wp.company_id
ON CONFLICT (company_id, round_no) DO NOTHING;