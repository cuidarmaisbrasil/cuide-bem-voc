CREATE TABLE public.tat_public_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phq9_score integer,
  symptom_count integer,
  severity_level text,
  age integer,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.tat_public_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tat_public_requests TO authenticated;
GRANT ALL ON public.tat_public_requests TO service_role;

ALTER TABLE public.tat_public_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request TAT"
  ON public.tat_public_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) <= 255);

CREATE POLICY "Admins can view TAT requests"
  ON public.tat_public_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update TAT requests"
  ON public.tat_public_requests
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete TAT requests"
  ON public.tat_public_requests
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tat_public_requests_updated_at
  BEFORE UPDATE ON public.tat_public_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tat_public_requests_status ON public.tat_public_requests(status, created_at DESC);