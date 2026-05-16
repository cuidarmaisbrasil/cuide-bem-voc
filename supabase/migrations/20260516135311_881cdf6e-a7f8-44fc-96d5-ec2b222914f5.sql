
-- 1. PHQ-9 latencies
ALTER TABLE public.test_events ADD COLUMN IF NOT EXISTS phq9_latencies_ms integer[];

-- 2. COPSOQ question overrides
CREATE TABLE IF NOT EXISTS public.copsoq_question_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL CHECK (version IN ('short','medium','long')),
  n integer NOT NULL,
  text_override text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version, n)
);
ALTER TABLE public.copsoq_question_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read overrides" ON public.copsoq_question_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage overrides" ON public.copsoq_question_overrides FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_copsoq_overrides_updated BEFORE UPDATE ON public.copsoq_question_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. COPSOQ report template (singleton)
CREATE TABLE IF NOT EXISTS public.copsoq_report_template (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.copsoq_report_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read template" ON public.copsoq_report_template FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage template" ON public.copsoq_report_template FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_copsoq_template_updated BEFORE UPDATE ON public.copsoq_report_template FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.copsoq_report_template (id, blocks) VALUES (1, '[
  {"id":"intro","title":"Introdução","body":"Este relatório apresenta os resultados agregados do questionário COPSOQ II aplicado aos colaboradores da sua empresa. Os dados são anônimos e seguem o protocolo validado por Silva et al. (2011)."},
  {"id":"metodo","title":"Metodologia","body":"O COPSOQ II avalia o ambiente psicossocial do trabalho em 8 dimensões: exigências, organização e conteúdo, relações sociais e liderança, interface trabalho-pessoa, valores no local de trabalho, saúde e bem-estar, e comportamentos ofensivos."},
  {"id":"interpret","title":"Como interpretar","body":"Escalas positivas (ex: apoio social, influência): quanto maior, melhor. Escalas negativas (ex: stress, burnout): quanto menor, melhor. As faixas seguem o referencial COPSOQ II: verde = saudável, amarelo = atenção, vermelho = risco."},
  {"id":"recom","title":"Recomendações gerais","body":"Para escalas em zona de risco, recomenda-se: 1) compartilhar os resultados com lideranças, 2) montar grupos de trabalho para discutir ações, 3) reavaliar em 6 meses."}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Notes per company
CREATE TABLE IF NOT EXISTS public.copsoq_company_notes (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.copsoq_company_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notes" ON public.copsoq_company_notes FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Owners read their notes" ON public.copsoq_company_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = copsoq_company_notes.company_id AND c.owner_user_id = auth.uid()));
CREATE TRIGGER trg_copsoq_notes_updated BEFORE UPDATE ON public.copsoq_company_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
