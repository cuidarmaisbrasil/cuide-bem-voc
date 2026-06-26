
CREATE TABLE public.sample_report_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  age INTEGER,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.sample_report_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.sample_report_leads TO authenticated;
GRANT ALL ON public.sample_report_leads TO service_role;

ALTER TABLE public.sample_report_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert sample leads"
  ON public.sample_report_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can view sample leads"
  ON public.sample_report_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can update sample leads"
  ON public.sample_report_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete sample leads"
  ON public.sample_report_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sample_report_leads_updated_at
  BEFORE UPDATE ON public.sample_report_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sample_report_leads_created_at ON public.sample_report_leads (created_at DESC);
