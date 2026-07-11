
-- 1. Add wave manager fields to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS wave_manager_name text,
  ADD COLUMN IF NOT EXISTS wave_manager_email text,
  ADD COLUMN IF NOT EXISTS wave_manager_role text,
  ADD COLUMN IF NOT EXISTS wave_manager_whatsapp text,
  ADD COLUMN IF NOT EXISTS wave_manager_user_id uuid;

-- 2. Add area/setor/departamento to wellness_participants
ALTER TABLE public.wellness_participants
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS setor text,
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS full_name text;

-- 3. First-wave approval fields
ALTER TABLE public.wellness_company_rounds
  ADD COLUMN IF NOT EXISTS first_wave_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_wave_approved_by uuid;

-- 4. New role: wave_manager
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wave_manager';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. company_wave_managers link table
CREATE TABLE IF NOT EXISTS public.company_wave_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_wave_managers TO authenticated;
GRANT ALL ON public.company_wave_managers TO service_role;

ALTER TABLE public.company_wave_managers ENABLE ROW LEVEL SECURITY;

-- Security definer helper (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_wave_manager_of(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_wave_managers
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.wave_manager_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_wave_managers WHERE user_id = _user_id
$$;

-- Policies for company_wave_managers
DROP POLICY IF EXISTS "wm can view own link" ON public.company_wave_managers;
CREATE POLICY "wm can view own link" ON public.company_wave_managers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage wm links" ON public.company_wave_managers;
CREATE POLICY "admins manage wm links" ON public.company_wave_managers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Extend wellness_participants RLS so wave managers (and owners) can CRUD
DROP POLICY IF EXISTS "wave managers manage participants" ON public.wellness_participants;
CREATE POLICY "wave managers manage participants" ON public.wellness_participants
  FOR ALL TO authenticated
  USING (
    public.is_wave_manager_of(auth.uid(), company_id)
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = wellness_participants.company_id AND c.owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.is_wave_manager_of(auth.uid(), company_id)
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = wellness_participants.company_id AND c.owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 7. Extend wellness_invitations RLS for wave managers/owners (read-only)
DROP POLICY IF EXISTS "wave managers view invitations" ON public.wellness_invitations;
CREATE POLICY "wave managers view invitations" ON public.wellness_invitations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wellness_participants p
      WHERE p.id = wellness_invitations.participant_id
        AND (
          public.is_wave_manager_of(auth.uid(), p.company_id)
          OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = p.company_id AND c.owner_user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- 8. RLS on wellness_company_rounds so wave managers can read + approve first wave
DROP POLICY IF EXISTS "wave managers view rounds" ON public.wellness_company_rounds;
CREATE POLICY "wave managers view rounds" ON public.wellness_company_rounds
  FOR SELECT TO authenticated
  USING (
    public.is_wave_manager_of(auth.uid(), company_id)
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = wellness_company_rounds.company_id AND c.owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
