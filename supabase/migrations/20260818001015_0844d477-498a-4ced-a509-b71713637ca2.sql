CREATE TABLE public.company_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number text,
  competencia text,
  description text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pendente',
  issued_at date,
  due_date date,
  paid_at date,
  file_path text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invoices TO authenticated;
GRANT ALL ON public.company_invoices TO service_role;

ALTER TABLE public.company_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoices"
ON public.company_invoices FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owner reads own invoices"
ON public.company_invoices FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = company_invoices.company_id AND c.owner_user_id = auth.uid()
));

CREATE INDEX idx_company_invoices_company ON public.company_invoices(company_id, issued_at DESC);

CREATE TRIGGER update_company_invoices_updated_at
BEFORE UPDATE ON public.company_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins manage invoice files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'company-invoices' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'company-invoices' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owner reads own invoice files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-invoices'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.owner_user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
  )
);