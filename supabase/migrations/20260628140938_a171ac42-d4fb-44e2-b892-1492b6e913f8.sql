-- 1) Psychometrics runs table
CREATE TABLE public.wellness_psychometrics_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_no int NOT NULL,
  instrument text NOT NULL,
  n_used int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  fit_indices jsonb,
  bias_metrics jsonb,
  invariance jsonb,
  error_msg text,
  computed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, round_no, instrument)
);

GRANT SELECT ON public.wellness_psychometrics_runs TO authenticated;
GRANT ALL ON public.wellness_psychometrics_runs TO service_role;

ALTER TABLE public.wellness_psychometrics_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all psychometrics"
  ON public.wellness_psychometrics_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owners read their psychometrics"
  ON public.wellness_psychometrics_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = wellness_psychometrics_runs.company_id
        AND c.owner_user_id = auth.uid()
    )
  );

CREATE TRIGGER set_updated_at_wellness_psychometrics_runs
  BEFORE UPDATE ON public.wellness_psychometrics_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_psychometrics_company_round
  ON public.wellness_psychometrics_runs (company_id, round_no);

-- 2) Longitudinal anonymous pairing
ALTER TABLE public.wellness_participants
  ADD COLUMN IF NOT EXISTS longitudinal_hash text;

CREATE INDEX IF NOT EXISTS idx_wellness_participants_longitudinal_hash
  ON public.wellness_participants (longitudinal_hash);

-- 3) Social desirability score on COPSOQ responses
ALTER TABLE public.copsoq_responses
  ADD COLUMN IF NOT EXISTS social_desirability_score smallint;

-- 4) Minimum-n thresholds for psychometric analyses
ALTER TABLE public.wellness_company_settings
  ADD COLUMN IF NOT EXISTS n_min_cfa int NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS n_min_invariance int NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS n_min_dif int NOT NULL DEFAULT 100;