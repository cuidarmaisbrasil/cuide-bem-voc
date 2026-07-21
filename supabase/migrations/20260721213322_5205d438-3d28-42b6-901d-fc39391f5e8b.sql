
CREATE TABLE public.wellness_individual_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  access_code_hash TEXT NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 2000),
  answered_at TIMESTAMPTZ,
  answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellness_individual_questions TO authenticated;
GRANT ALL ON public.wellness_individual_questions TO service_role;
ALTER TABLE public.wellness_individual_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage individual questions"
  ON public.wellness_individual_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Wave managers view their company's questions"
  ON public.wellness_individual_questions FOR SELECT
  TO authenticated
  USING (public.is_wave_manager_of(auth.uid(), company_id));
CREATE INDEX idx_wiq_company ON public.wellness_individual_questions(company_id, created_at DESC);
