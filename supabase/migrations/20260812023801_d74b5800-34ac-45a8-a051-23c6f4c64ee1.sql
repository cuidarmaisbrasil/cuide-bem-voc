DROP POLICY IF EXISTS "Anyone can view approved companies by slug" ON public.companies;

CREATE POLICY "Wave managers can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_wave_managers m
    WHERE m.company_id = companies.id AND m.user_id = auth.uid()
  )
  OR wave_manager_user_id = auth.uid()
);

CREATE OR REPLACE VIEW public.companies_public AS
SELECT id, slug, name, allowed_versions, default_version, status
FROM public.companies
WHERE status = 'approved';

GRANT SELECT ON public.companies_public TO anon, authenticated;