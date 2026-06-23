
-- 1) Master access code hash on participant
ALTER TABLE public.wellness_participants
  ADD COLUMN IF NOT EXISTS access_code_hash text,
  ADD COLUMN IF NOT EXISTS access_code_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_code_first_used_at timestamptz;

CREATE INDEX IF NOT EXISTS wellness_participants_access_code_hash_idx
  ON public.wellness_participants (access_code_hash);

-- 2) Per-wave response tables: track the access_code_hash to fetch by code without identifying email
ALTER TABLE public.phq9_company_responses     ADD COLUMN IF NOT EXISTS access_code_hash text;
ALTER TABLE public.ecig_responses             ADD COLUMN IF NOT EXISTS access_code_hash text;
ALTER TABLE public.copsoq_responses           ADD COLUMN IF NOT EXISTS access_code_hash text;
ALTER TABLE public.psicossocial_responses     ADD COLUMN IF NOT EXISTS access_code_hash text;
ALTER TABLE public.assedio_sexual_responses   ADD COLUMN IF NOT EXISTS access_code_hash text;

CREATE INDEX IF NOT EXISTS phq9_company_responses_acch_idx     ON public.phq9_company_responses (access_code_hash);
CREATE INDEX IF NOT EXISTS ecig_responses_acch_idx             ON public.ecig_responses (access_code_hash);
CREATE INDEX IF NOT EXISTS copsoq_responses_acch_idx           ON public.copsoq_responses (access_code_hash);
CREATE INDEX IF NOT EXISTS psicossocial_responses_acch_idx     ON public.psicossocial_responses (access_code_hash);
CREATE INDEX IF NOT EXISTS assedio_sexual_responses_acch_idx   ON public.assedio_sexual_responses (access_code_hash);

-- 3) Admin-editable templates for the individual report (per wave + per section)
CREATE TABLE IF NOT EXISTS public.individual_report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wave text NOT NULL,                  -- 'phq9' | 'ecig' | 'copsoq' | 'psicossocial' | 'assedio_sexual' | 'global'
  section_key text NOT NULL,           -- e.g. 'header','intro','score','interpretation','signs','self_care','contacts','closing','disclaimer'
  severity text NOT NULL DEFAULT 'all',-- 'all' | 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' | custom band
  title text,
  body text,
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wave, section_key, severity)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.individual_report_templates TO authenticated;
GRANT ALL ON public.individual_report_templates TO service_role;

ALTER TABLE public.individual_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage individual report templates"
  ON public.individual_report_templates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_individual_report_templates_updated_at
  BEFORE UPDATE ON public.individual_report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
