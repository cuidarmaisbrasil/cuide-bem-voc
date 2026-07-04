-- 1) Tabela de respostas GAD-7 (mesmo padrão do phq9_company_responses)
CREATE TABLE public.gad7_company_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_no INTEGER NOT NULL DEFAULT 1,
  participant_token_hash TEXT NOT NULL,
  access_code_hash TEXT,
  answers JSONB NOT NULL,
  latencies_ms JSONB,
  score INTEGER NOT NULL,
  severity TEXT NOT NULL,
  age INTEGER,
  age_range TEXT,
  gender TEXT,
  department TEXT,
  tenure_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gad7_company_responses_company_idx ON public.gad7_company_responses(company_id, round_no);
CREATE INDEX gad7_company_responses_access_code_idx ON public.gad7_company_responses(access_code_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gad7_company_responses TO authenticated;
GRANT ALL ON public.gad7_company_responses TO service_role;

ALTER TABLE public.gad7_company_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all GAD-7 responses"
ON public.gad7_company_responses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their own GAD-7 responses"
ON public.gad7_company_responses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = gad7_company_responses.company_id
      AND c.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Service role manages GAD-7 responses"
ON public.gad7_company_responses FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER update_gad7_company_responses_updated_at
BEFORE UPDATE ON public.gad7_company_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Itens do GAD-7 em pt-BR (Spitzer et al. 2006; validação BR: Moreno et al. 2016)
INSERT INTO public.instrument_questions (instrument, n, text, scale, reverse, response_set, active)
VALUES
  ('gad7', 1, 'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)', 'gad7', false, 'phq9_freq', true),
  ('gad7', 2, 'Não ser capaz de impedir ou de controlar as preocupações', 'gad7', false, 'phq9_freq', true),
  ('gad7', 3, 'Preocupar-se muito com diversas coisas', 'gad7', false, 'phq9_freq', true),
  ('gad7', 4, 'Dificuldade para relaxar', 'gad7', false, 'phq9_freq', true),
  ('gad7', 5, 'Ficar tão agitado(a) que se torna difícil permanecer parado(a)', 'gad7', false, 'phq9_freq', true),
  ('gad7', 6, 'Ficar facilmente aborrecido(a) ou irritado(a)', 'gad7', false, 'phq9_freq', true),
  ('gad7', 7, 'Sentir medo como se algo horrível fosse acontecer', 'gad7', false, 'phq9_freq', true);
