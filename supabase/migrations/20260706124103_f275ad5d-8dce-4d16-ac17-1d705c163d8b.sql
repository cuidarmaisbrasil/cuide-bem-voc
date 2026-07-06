CREATE TABLE public.sales_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT,
  sector TEXT,
  employee_size TEXT,
  city TEXT,
  state TEXT,
  fit_score INTEGER NOT NULL DEFAULT 0,
  fit_rationale TEXT,
  target_role TEXT,
  outreach_copy TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  seller_notes TEXT,
  search_query TEXT,
  source_urls JSONB DEFAULT '[]'::jsonb,
  ai_model TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sales_prospects_status_idx ON public.sales_prospects(status);
CREATE INDEX sales_prospects_score_idx ON public.sales_prospects(fit_score DESC);
CREATE INDEX sales_prospects_created_idx ON public.sales_prospects(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_prospects TO authenticated;
GRANT ALL ON public.sales_prospects TO service_role;

ALTER TABLE public.sales_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sales_prospects" ON public.sales_prospects
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sales_prospects" ON public.sales_prospects
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales_prospects" ON public.sales_prospects
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales_prospects" ON public.sales_prospects
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sales_prospects_updated_at
  BEFORE UPDATE ON public.sales_prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();