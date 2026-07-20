
ALTER TABLE public.sales_prospects
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS cnae_principal TEXT,
  ADD COLUMN IF NOT EXISTS situacao_cadastral TEXT,
  ADD COLUMN IF NOT EXISTS municipio TEXT,
  ADD COLUMN IF NOT EXISTS uf TEXT,
  ADD COLUMN IF NOT EXISTS porte_receita TEXT,
  ADD COLUMN IF NOT EXISTS capital_social NUMERIC,
  ADD COLUMN IF NOT EXISTS data_abertura DATE,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT;

CREATE INDEX IF NOT EXISTS sales_prospects_cnpj_idx ON public.sales_prospects (cnpj);
