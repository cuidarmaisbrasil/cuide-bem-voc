
-- 1) Drop legacy first-admin bootstrap trigger to prevent privilege escalation
DROP TRIGGER IF EXISTS on_auth_user_created_first_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_first_admin();

-- 2) Edge function rate-limit table (IP-hash sliding window counter)
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,
  ip_hash text NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS edge_rate_limits_unique
  ON public.edge_rate_limits (endpoint, ip_hash, window_start);
CREATE INDEX IF NOT EXISTS edge_rate_limits_window_idx
  ON public.edge_rate_limits (window_start);

GRANT ALL ON public.edge_rate_limits TO service_role;

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) needs access; no policies for anon/authenticated.
CREATE POLICY "Admins can view rate limits"
  ON public.edge_rate_limits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
