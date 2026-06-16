
-- TAT images catalog
CREATE TABLE public.tat_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tat_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tat_images TO authenticated;
GRANT ALL ON public.tat_images TO service_role;

ALTER TABLE public.tat_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active TAT images"
ON public.tat_images FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage TAT images"
ON public.tat_images FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tat_images_updated_at
BEFORE UPDATE ON public.tat_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TAT responses
CREATE TABLE public.tat_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_no INT NOT NULL DEFAULT 1,
  participant_token_hash TEXT NOT NULL,
  image_id UUID REFERENCES public.tat_images(id) ON DELETE SET NULL,
  narrative TEXT NOT NULL,
  time_ms INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  age_range TEXT,
  gender TEXT,
  department TEXT,
  tenure_range TEXT,
  scores JSONB,
  analyst_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.tat_responses TO authenticated;
GRANT ALL ON public.tat_responses TO service_role;

ALTER TABLE public.tat_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read TAT responses"
ON public.tat_responses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update TAT responses (scoring/notes)"
ON public.tat_responses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tat_responses_updated_at
BEFORE UPDATE ON public.tat_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tat_responses_company_round ON public.tat_responses(company_id, round_no);
