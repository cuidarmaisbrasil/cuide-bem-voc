-- Token para o usuário responder o TAT por link único enviado no e-mail
ALTER TABLE public.tat_public_requests
  ADD COLUMN IF NOT EXISTS response_token uuid UNIQUE DEFAULT gen_random_uuid();

CREATE TABLE public.tat_public_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tat_public_requests(id) ON DELETE CASCADE,
  image_id uuid REFERENCES public.tat_images(id) ON DELETE SET NULL,
  narrative text NOT NULL,
  time_ms integer,
  word_count integer,
  -- Metadados do respondente (anônimo)
  user_agent text,
  -- Campos para análise futura pelo psicólogo / admin
  admin_notes text,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tat_public_responses TO authenticated;
GRANT ALL ON public.tat_public_responses TO service_role;

ALTER TABLE public.tat_public_responses ENABLE ROW LEVEL SECURITY;

-- Admins têm acesso total
CREATE POLICY "Admins can view TAT public responses"
  ON public.tat_public_responses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update TAT public responses"
  ON public.tat_public_responses
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete TAT public responses"
  ON public.tat_public_responses
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserção feita exclusivamente via edge function (service_role) usando o token,
-- então não exponho INSERT para anon/authenticated diretamente.

CREATE TRIGGER update_tat_public_responses_updated_at
  BEFORE UPDATE ON public.tat_public_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tat_public_responses_request ON public.tat_public_responses(request_id);
CREATE INDEX idx_tat_public_responses_status ON public.tat_public_responses(status, created_at DESC);
CREATE INDEX idx_tat_public_responses_reviewed ON public.tat_public_responses(reviewed_at);