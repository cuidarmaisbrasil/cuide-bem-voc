CREATE TABLE public.company_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  version text NOT NULL DEFAULT 'v1',
  contract_hash text NOT NULL,
  signer_name text NOT NULL,
  signer_cpf text NOT NULL,
  signer_role text NOT NULL,
  signer_email text NOT NULL,
  headcount_declared integer,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text,
  signed_file_path text,
  signed_file_uploaded_at timestamptz,
  status text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX company_contracts_company_idx ON public.company_contracts(company_id, accepted_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.company_contracts TO authenticated;
GRANT ALL ON public.company_contracts TO service_role;

ALTER TABLE public.company_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contracts"
ON public.company_contracts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company side can view own contracts"
ON public.company_contracts FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  OR public.is_wave_manager_of(auth.uid(), company_id)
);

CREATE POLICY "Company side can sign own contracts"
ON public.company_contracts FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  OR public.is_wave_manager_of(auth.uid(), company_id)
);

CREATE POLICY "Company side can attach signed file"
ON public.company_contracts FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  OR public.is_wave_manager_of(auth.uid(), company_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  OR public.is_wave_manager_of(auth.uid(), company_id)
);

CREATE TRIGGER update_company_contracts_updated_at
BEFORE UPDATE ON public.company_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Contract files readable by company side and admins"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-contracts' AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR public.is_wave_manager_of(auth.uid(), c.id))
    )
  )
);

CREATE POLICY "Contract files uploadable by company side and admins"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-contracts' AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR public.is_wave_manager_of(auth.uid(), c.id))
    )
  )
);