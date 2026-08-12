-- Remove anon access to the base table entirely
DROP POLICY IF EXISTS "Public can view approved companies (limited columns)" ON public.companies;
REVOKE ALL ON public.companies FROM anon;

-- Replace the view with a mirror table holding only public columns
DROP VIEW IF EXISTS public.companies_public;

CREATE TABLE public.companies_public (
  id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text,
  name text,
  allowed_versions text[],
  default_version text,
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.companies_public TO anon, authenticated;
GRANT ALL ON public.companies_public TO service_role;

ALTER TABLE public.companies_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved companies are publicly listable"
ON public.companies_public
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Keep the mirror in sync with the base table
CREATE OR REPLACE FUNCTION public.sync_companies_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.companies_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.companies_public (id, slug, name, allowed_versions, default_version, status, updated_at)
    VALUES (NEW.id, NEW.slug, NEW.name, NEW.allowed_versions, NEW.default_version, NEW.status, now())
    ON CONFLICT (id) DO UPDATE
      SET slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          allowed_versions = EXCLUDED.allowed_versions,
          default_version = EXCLUDED.default_version,
          status = EXCLUDED.status,
          updated_at = now();
  ELSE
    DELETE FROM public.companies_public WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_companies_public() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_companies_public ON public.companies;
CREATE TRIGGER trg_sync_companies_public
AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.sync_companies_public();

-- Backfill
INSERT INTO public.companies_public (id, slug, name, allowed_versions, default_version, status)
SELECT id, slug, name, allowed_versions, default_version, status
FROM public.companies
WHERE status = 'approved'
ON CONFLICT (id) DO NOTHING;