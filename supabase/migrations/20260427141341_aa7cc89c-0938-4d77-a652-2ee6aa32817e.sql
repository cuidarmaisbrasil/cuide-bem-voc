CREATE TABLE public.severity_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.severity_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active severity articles"
ON public.severity_articles
FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins can view all severity articles"
ON public.severity_articles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage severity articles"
ON public.severity_articles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_severity_articles_updated_at
BEFORE UPDATE ON public.severity_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.severity_articles (severity, label, url, source) VALUES
  ('Mínima', 'O que é depressão — OPAS/OMS (em português)', 'https://www.paho.org/pt/topicos/depressao', 'OPAS/OMS'),
  ('Leve', 'Depressão leve: diretrizes da Associação Médica Brasileira (SciELO)', 'https://www.scielo.br/j/rbp/a/bJdCdvw3H5hGwzLwVvMPXbp/?lang=pt', 'AMB / SciELO'),
  ('Moderada', 'Depressão moderada: diretrizes da Associação Médica Brasileira (SciELO)', 'https://www.scielo.br/j/rbp/a/bJdCdvw3H5hGwzLwVvMPXbp/?lang=pt', 'AMB / SciELO'),
  ('Moderadamente grave', 'Depressão moderadamente grave: diretrizes da AMB (SciELO)', 'https://www.scielo.br/j/rbp/a/bJdCdvw3H5hGwzLwVvMPXbp/?lang=pt', 'AMB / SciELO'),
  ('Grave', 'Depressão grave: folha informativa da OPAS/OMS (em português)', 'https://www.paho.org/pt/topicos/depressao', 'OPAS/OMS');