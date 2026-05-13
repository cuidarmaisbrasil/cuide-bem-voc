
-- Add 'company' role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'company';

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  size_range TEXT,
  sector TEXT,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  default_version TEXT NOT NULL DEFAULT 'short' CHECK (default_version IN ('short','medium','long')),
  allowed_versions TEXT[] NOT NULL DEFAULT ARRAY['short','medium','long'],
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_owner ON public.companies(owner_user_id);
CREATE INDEX idx_companies_status ON public.companies(status);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their company"
  ON public.companies FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Anyone can insert their own company registration"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Owners can update limited fields of their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Admins can manage all companies"
  ON public.companies FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Viewers can view all companies"
  ON public.companies FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'viewer'));

-- Public can view minimal info for an approved slug (so the questionnaire page can load by slug)
CREATE POLICY "Anyone can view approved companies by slug"
  ON public.companies FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COPSOQ responses
CREATE TABLE public.copsoq_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version TEXT NOT NULL CHECK (version IN ('short','medium','long')),
  answers JSONB NOT NULL,
  scores JSONB,
  age_range TEXT,
  gender TEXT,
  department TEXT,
  tenure_range TEXT,
  ip_hash TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_copsoq_responses_company ON public.copsoq_responses(company_id);
CREATE INDEX idx_copsoq_responses_created ON public.copsoq_responses(created_at DESC);

ALTER TABLE public.copsoq_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a response to an approved company"
  ON public.copsoq_responses FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.status = 'approved'
    )
  );

CREATE POLICY "Company owners can view their responses"
  ON public.copsoq_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all responses"
  ON public.copsoq_responses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Viewers can view all responses"
  ON public.copsoq_responses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'viewer'));

CREATE POLICY "Admins can manage all responses"
  ON public.copsoq_responses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
