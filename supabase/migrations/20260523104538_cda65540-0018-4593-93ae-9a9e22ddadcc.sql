
CREATE TABLE public.psicossocial_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  participant_token_hash text NOT NULL,
  instrument text NOT NULL DEFAULT 'lipt60',
  answers jsonb NOT NULL,
  latencies_ms jsonb NOT NULL,
  scores jsonb,
  age_range text,
  gender text,
  department text,
  tenure_range text,
  ip_hash text,
  country text,
  region text,
  city text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.psicossocial_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage psicossocial"
ON public.psicossocial_responses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners read psicossocial"
ON public.psicossocial_responses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM companies c WHERE c.id = psicossocial_responses.company_id AND c.owner_user_id = auth.uid()));

CREATE POLICY "Viewers read psicossocial"
ON public.psicossocial_responses FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Anyone can submit psicossocial to approved company"
ON public.psicossocial_responses FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM companies c WHERE c.id = psicossocial_responses.company_id AND c.status = 'approved'));

CREATE INDEX idx_psicossocial_company ON public.psicossocial_responses(company_id, created_at DESC);
