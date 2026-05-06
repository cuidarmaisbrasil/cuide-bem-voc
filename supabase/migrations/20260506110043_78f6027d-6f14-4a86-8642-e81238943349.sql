
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  country text,
  region text,
  city text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_path text
);

CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON public.sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS sessions_ip_hash_idx ON public.sessions(ip_hash);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
