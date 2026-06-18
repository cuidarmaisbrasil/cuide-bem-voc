-- 1) Plates table (mirrors tat_images)
CREATE TABLE public.rorschach_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  storage_path text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rorschach_images TO anon, authenticated;
GRANT ALL ON public.rorschach_images TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.rorschach_images TO authenticated;
ALTER TABLE public.rorschach_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active Rorschach plates"
ON public.rorschach_images
FOR SELECT
TO anon, authenticated
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage Rorschach plates"
ON public.rorschach_images
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER rorschach_images_updated
BEFORE UPDATE ON public.rorschach_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Responses table (mirrors tat_responses)
CREATE TABLE public.rorschach_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  round_no int NOT NULL DEFAULT 1,
  participant_token_hash text NOT NULL,
  image_id uuid REFERENCES public.rorschach_images(id) ON DELETE SET NULL,
  narrative text NOT NULL,
  time_ms int NOT NULL DEFAULT 0,
  started_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  age_range text,
  gender text,
  department text,
  tenure_range text,
  scores jsonb,
  analyst_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rorschach_responses TO service_role;
GRANT SELECT, UPDATE ON public.rorschach_responses TO authenticated;
ALTER TABLE public.rorschach_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view Rorschach responses"
ON public.rorschach_responses
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update Rorschach responses"
ON public.rorschach_responses
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_rorschach_responses_company_round
ON public.rorschach_responses (company_id, round_no);

CREATE TRIGGER rorschach_responses_updated
BEFORE UPDATE ON public.rorschach_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();