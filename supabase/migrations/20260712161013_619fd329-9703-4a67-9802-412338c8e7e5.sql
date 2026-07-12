-- =========================================================================
-- FASE 1 — Instrumentação comportamental para detecção de fraude/bot
-- =========================================================================

-- 1) telemetry_sessions
CREATE TABLE public.telemetry_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  company_id UUID,
  round_no INTEGER,
  instrument TEXT,
  fingerprint_hash TEXT,
  user_agent TEXT,
  device_type TEXT,
  os_name TEXT,
  browser_name TEXT,
  viewport_w INTEGER,
  viewport_h INTEGER,
  dpr NUMERIC,
  screen_w INTEGER,
  screen_h INTEGER,
  timezone TEXT,
  locale TEXT,
  ip_hash TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_flush_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  flush_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_telemetry_sessions_token ON public.telemetry_sessions(session_token);
CREATE INDEX idx_telemetry_sessions_company_round ON public.telemetry_sessions(company_id, round_no);
CREATE INDEX idx_telemetry_sessions_started_at ON public.telemetry_sessions(started_at DESC);

GRANT ALL ON public.telemetry_sessions TO service_role;
GRANT SELECT ON public.telemetry_sessions TO authenticated;

ALTER TABLE public.telemetry_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view telemetry sessions"
  ON public.telemetry_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_telemetry_sessions_updated_at
  BEFORE UPDATE ON public.telemetry_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) telemetry_events
CREATE TABLE public.telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
  instrument TEXT,
  item_index INTEGER,
  event_type TEXT NOT NULL,
  t_ms INTEGER NOT NULL,
  value JSONB,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_telemetry_events_session ON public.telemetry_events(session_id);
CREATE INDEX idx_telemetry_events_created_at ON public.telemetry_events(created_at);
CREATE INDEX idx_telemetry_events_type ON public.telemetry_events(event_type);

GRANT ALL ON public.telemetry_events TO service_role;
GRANT SELECT ON public.telemetry_events TO authenticated;

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view telemetry events"
  ON public.telemetry_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- 3) telemetry_scores
CREATE TABLE public.telemetry_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL,
  authenticity_score NUMERIC(4,3) NOT NULL,
  flag TEXT NOT NULL DEFAULT 'ok',
  n_items INTEGER,
  median_time_ms INTEGER,
  total_time_ms INTEGER,
  straightlining BOOLEAN NOT NULL DEFAULT false,
  had_paste BOOLEAN NOT NULL DEFAULT false,
  blur_count INTEGER NOT NULL DEFAULT 0,
  fast_ratio NUMERIC(4,3),
  signals JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_telemetry_scores_session ON public.telemetry_scores(session_id);
CREATE INDEX idx_telemetry_scores_flag ON public.telemetry_scores(flag);
CREATE INDEX idx_telemetry_scores_created_at ON public.telemetry_scores(created_at DESC);

GRANT ALL ON public.telemetry_scores TO service_role;
GRANT SELECT ON public.telemetry_scores TO authenticated;

ALTER TABLE public.telemetry_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view telemetry scores"
  ON public.telemetry_scores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_telemetry_scores_updated_at
  BEFORE UPDATE ON public.telemetry_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();