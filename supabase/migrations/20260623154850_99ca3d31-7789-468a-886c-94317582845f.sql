-- Default cycle: 3 months
ALTER TABLE public.wellness_company_settings ALTER COLUMN cadence_months SET DEFAULT 3;

-- Editable copy blocks managed by admin (recommendations, email footer, etc.)
CREATE TABLE public.wellness_editable_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wellness_editable_texts TO anon, authenticated;
GRANT ALL ON public.wellness_editable_texts TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.wellness_editable_texts TO authenticated;

ALTER TABLE public.wellness_editable_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read editable texts"
ON public.wellness_editable_texts FOR SELECT
USING (true);

CREATE POLICY "Admins manage editable texts"
ON public.wellness_editable_texts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_wellness_editable_texts_updated_at
BEFORE UPDATE ON public.wellness_editable_texts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default copy
INSERT INTO public.wellness_editable_texts (key, label, content) VALUES
  ('admin_enroll_recommendation',
   'Aviso na tela de enroll (admin)',
   'Recomende aos colaboradores que reservem um momento do horário usual de trabalho para responder, com calma e privacidade. As 5 ondas são enviadas em D+1, D+7, D+15, D+22 e D+30 a partir do enroll. O ciclo completo se repete a cada 3 meses.'),
  ('trabalho_page_recommendation',
   'Aviso na página /trabalho (empresa)',
   'O Cuidar+ Trabalho envia 5 ondas de testes em D+1, D+7, D+15, D+22 e D+30, e repete o ciclo a cada 3 meses. Oriente que os colaboradores respondam durante o horário usual de trabalho — respeitar esse tempo faz parte da cultura de cuidado.'),
  ('email_invite_work_hours_note',
   'Rodapé do e-mail de convite',
   'Reserve um momento do seu horário usual de trabalho para responder com calma. Sua empresa apoia essa pausa.')
ON CONFLICT (key) DO NOTHING;