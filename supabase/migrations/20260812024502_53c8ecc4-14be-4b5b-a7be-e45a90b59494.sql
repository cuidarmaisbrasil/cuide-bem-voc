-- 1) Row policy: anonymous visitors may only see approved companies
DROP POLICY IF EXISTS "Public can view approved companies (limited columns)" ON public.companies;
CREATE POLICY "Public can view approved companies (limited columns)"
ON public.companies
FOR SELECT
TO anon
USING (status = 'approved');

-- 2) Column-level privileges: anon can read ONLY the public columns
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (id, slug, name, allowed_versions, default_version, status)
  ON public.companies TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- 3) Recreate the public view as SECURITY INVOKER so the caller's RLS applies
DROP VIEW IF EXISTS public.companies_public;
CREATE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT id, slug, name, allowed_versions, default_version, status
FROM public.companies
WHERE status = 'approved';

GRANT SELECT ON public.companies_public TO anon, authenticated;