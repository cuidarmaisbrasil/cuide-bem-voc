-- 1. add age column to test_events
ALTER TABLE public.test_events ADD COLUMN IF NOT EXISTS age integer;

-- 2. admin ip hashes table
CREATE TABLE IF NOT EXISTS public.admin_ip_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL UNIQUE,
  label text,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_ip_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin ip hashes"
  ON public.admin_ip_hashes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage admin ip hashes"
  ON public.admin_ip_hashes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_test_events_ip_hash ON public.test_events(ip_hash);
CREATE INDEX IF NOT EXISTS idx_link_clicks_ip_hash ON public.link_clicks(ip_hash);