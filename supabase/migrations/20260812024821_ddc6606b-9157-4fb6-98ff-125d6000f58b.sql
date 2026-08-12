CREATE OR REPLACE FUNCTION public.company_protected_fields_unchanged(
  _id uuid,
  _status text,
  _approved_at timestamptz,
  _wave_manager_user_id uuid,
  _allowed_versions text[],
  _default_version text,
  _slug text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _id
      AND c.status IS NOT DISTINCT FROM _status
      AND c.approved_at IS NOT DISTINCT FROM _approved_at
      AND c.wave_manager_user_id IS NOT DISTINCT FROM _wave_manager_user_id
      AND c.allowed_versions IS NOT DISTINCT FROM _allowed_versions
      AND c.default_version IS NOT DISTINCT FROM _default_version
      AND c.slug IS NOT DISTINCT FROM _slug
  )
$$;

REVOKE EXECUTE ON FUNCTION public.company_protected_fields_unchanged(uuid, text, timestamptz, uuid, text[], text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_protected_fields_unchanged(uuid, text, timestamptz, uuid, text[], text, text) TO authenticated;

DROP POLICY IF EXISTS "Owners can update limited fields of their company" ON public.companies;
CREATE POLICY "Owners can update limited fields of their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (
  owner_user_id = auth.uid()
  AND public.company_protected_fields_unchanged(
        id, status, approved_at, wave_manager_user_id, allowed_versions, default_version, slug
      )
);