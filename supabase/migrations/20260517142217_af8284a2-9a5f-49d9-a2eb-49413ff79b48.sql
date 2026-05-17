
-- Allow PT and BR variants of COPSOQ versions
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_default_version_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_default_version_check
  CHECK (default_version IN ('short','medium','long','short_pt','medium_pt','long_pt','short_br','medium_br','long_br'));

ALTER TABLE public.companies ALTER COLUMN default_version SET DEFAULT 'short_br';
ALTER TABLE public.companies ALTER COLUMN allowed_versions SET DEFAULT ARRAY['short_pt','medium_pt','long_pt','short_br','medium_br','long_br'];

ALTER TABLE public.copsoq_responses DROP CONSTRAINT IF EXISTS copsoq_responses_version_check;
ALTER TABLE public.copsoq_responses
  ADD CONSTRAINT copsoq_responses_version_check
  CHECK (version IN ('short','medium','long','short_pt','medium_pt','long_pt','short_br','medium_br','long_br'));
