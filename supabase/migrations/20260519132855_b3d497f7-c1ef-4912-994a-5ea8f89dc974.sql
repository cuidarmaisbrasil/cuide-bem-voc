
-- ===== Wellness program: 3-wave preventive assessment =====

-- 1. Participants (one row per worker per company)
CREATE TABLE public.wellness_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  token_hash TEXT GENERATED ALWAYS AS (encode(digest(token::text, 'sha256'), 'hex')) STORED,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, email),
  UNIQUE (token)
);
CREATE INDEX idx_wellness_participants_company ON public.wellness_participants(company_id);
CREATE INDEX idx_wellness_participants_token_hash ON public.wellness_participants(token_hash);

-- 2. Invitations (3 per participant)
CREATE TABLE public.wellness_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.wellness_participants(id) ON DELETE CASCADE,
  wave TEXT NOT NULL CHECK (wave IN ('phq9','ecig','copsoq')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','completed','failed','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_id, wave)
);
CREATE INDEX idx_wellness_invitations_due ON public.wellness_invitations(scheduled_at) WHERE sent_at IS NULL AND status='pending';
CREATE INDEX idx_wellness_invitations_participant ON public.wellness_invitations(participant_id);

-- 3. Editable items (unified instrument bank: phq9 / ecig / copsoq_*)
CREATE TABLE public.instrument_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument TEXT NOT NULL,
  n INT NOT NULL,
  text TEXT NOT NULL,
  scale TEXT,
  reverse BOOLEAN NOT NULL DEFAULT false,
  response_set TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instrument, n)
);
CREATE INDEX idx_instrument_questions_instrument ON public.instrument_questions(instrument);
CREATE TRIGGER trg_instrument_questions_updated
  BEFORE UPDATE ON public.instrument_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. PHQ-9 corporate responses
CREATE TABLE public.phq9_company_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  participant_token_hash TEXT NOT NULL,
  answers JSONB NOT NULL,
  latencies_ms JSONB NOT NULL,
  score INT,
  severity TEXT,
  functional_impact INT,
  symptoms TEXT[],
  age INT,
  age_range TEXT,
  gender TEXT,
  department TEXT,
  tenure_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phq9_company_responses_company ON public.phq9_company_responses(company_id);

-- 5. ECIG responses
CREATE TABLE public.ecig_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  participant_token_hash TEXT NOT NULL,
  answers JSONB NOT NULL,
  latencies_ms JSONB NOT NULL,
  scores JSONB,
  age_range TEXT,
  gender TEXT,
  department TEXT,
  tenure_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ecig_responses_company ON public.ecig_responses(company_id);

-- 6. Extend copsoq_responses with token + latencies (non-breaking)
ALTER TABLE public.copsoq_responses
  ADD COLUMN IF NOT EXISTS participant_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS latencies_ms JSONB;

-- ===== RLS =====
ALTER TABLE public.wellness_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phq9_company_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecig_responses ENABLE ROW LEVEL SECURITY;

-- Participants: admins manage; owners see aggregate only (no email exposed via direct select; we'll provide a view-like RLS that hides email)
CREATE POLICY "Admins manage participants" ON public.wellness_participants
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Viewers read participants" ON public.wellness_participants
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'viewer'));
-- company owners intentionally NOT given direct access to participants (keeps emails private). Aggregates exposed via edge function.

CREATE POLICY "Admins manage invitations" ON public.wellness_invitations
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Viewers read invitations" ON public.wellness_invitations
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'viewer'));

CREATE POLICY "Anyone reads active items" ON public.instrument_questions
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins manage items" ON public.instrument_questions
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read all items" ON public.instrument_questions
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage phq9 company" ON public.phq9_company_responses
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Viewers read phq9 company" ON public.phq9_company_responses
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'viewer'));
CREATE POLICY "Owners read phq9 company" ON public.phq9_company_responses
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = phq9_company_responses.company_id AND c.owner_user_id = auth.uid()));

CREATE POLICY "Admins manage ecig" ON public.ecig_responses
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Viewers read ecig" ON public.ecig_responses
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'viewer'));
CREATE POLICY "Owners read ecig" ON public.ecig_responses
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = ecig_responses.company_id AND c.owner_user_id = auth.uid()));

-- Ensure pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
