CREATE OR REPLACE FUNCTION public.guard_company_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and server-side (service_role / no JWT) updates are unrestricted
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
     OR NEW.wave_manager_user_id IS DISTINCT FROM OLD.wave_manager_user_id
     OR NEW.cnpj IS DISTINCT FROM OLD.cnpj
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.allowed_versions IS DISTINCT FROM OLD.allowed_versions
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
  THEN
    RAISE EXCEPTION 'Alteração não permitida: campos privilegiados da empresa só podem ser alterados por administradores';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_company_privileged_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_company_privileged_fields ON public.companies;
CREATE TRIGGER trg_guard_company_privileged_fields
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.guard_company_privileged_fields();