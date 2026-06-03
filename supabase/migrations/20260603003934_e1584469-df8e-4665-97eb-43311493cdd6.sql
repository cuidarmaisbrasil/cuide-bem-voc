
-- Per-company configuration
CREATE TABLE IF NOT EXISTS public.wellness_company_settings (
  company_id uuid PRIMARY KEY,
  min_recorte_company integer NOT NULL DEFAULT 5,
  min_recorte_department integer NOT NULL DEFAULT 5,
  cadence_months integer NOT NULL DEFAULT 4,
  cadence_auto_open boolean NOT NULL DEFAULT false,
  reminder_days integer[] NOT NULL DEFAULT ARRAY[3,7,14],
  signal_min_adherence_pct integer NOT NULL DEFAULT 40,
  signal_max_days_since_devolutiva integer NOT NULL DEFAULT 180,
  signals_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellness_company_settings TO authenticated;
GRANT ALL ON public.wellness_company_settings TO service_role;

ALTER TABLE public.wellness_company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage wellness settings"
ON public.wellness_company_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners read their wellness settings"
ON public.wellness_company_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.companies c
  WHERE c.id = wellness_company_settings.company_id AND c.owner_user_id = auth.uid()));

CREATE TRIGGER trg_wellness_company_settings_updated
BEFORE UPDATE ON public.wellness_company_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reminder tracking on invitations
ALTER TABLE public.wellness_invitations
  ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;
