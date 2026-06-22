
-- 5ª onda: assédio sexual (MDiSH + SHRAS)
-- 1) Tabela de respostas
CREATE TABLE public.assedio_sexual_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_no integer NOT NULL DEFAULT 1,
  participant_token_hash text NOT NULL,
  answers jsonb NOT NULL,
  latencies_ms jsonb NOT NULL,
  scores jsonb,
  age_range text,
  gender text,
  department text,
  tenure_range text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assedio_sexual_responses TO authenticated;
GRANT ALL ON public.assedio_sexual_responses TO service_role;
ALTER TABLE public.assedio_sexual_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage assedio_sexual_responses"
  ON public.assedio_sexual_responses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owner reads own"
  ON public.assedio_sexual_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid()));

CREATE POLICY "Service role writes"
  ON public.assedio_sexual_responses FOR INSERT
  WITH CHECK (false);

CREATE INDEX idx_asx_responses_company_round ON public.assedio_sexual_responses(company_id, round_no);

CREATE TRIGGER trg_asx_responses_updated_at
  BEFORE UPDATE ON public.assedio_sexual_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Itens do instrumento (MDiSH 18 + SHRAS 10) em PT-BR
-- Response sets esperados no front: 'asx_5' (Discordo totalmente .. Concordo totalmente)
INSERT INTO public.instrument_questions (instrument, n, text, scale, reverse, response_set, active) VALUES
-- MDiSH (Page, Pina & Giner-Sorolla 2016) — 18 itens, 8 mecanismos de desengajamento moral
('assedio_sexual', 1, 'Brincadeiras com conteúdo sexual no trabalho ajudam a aliviar o estresse da equipe.', 'mdish_moral_justification', false, 'asx_5', true),
('assedio_sexual', 2, 'Comentários sobre o corpo de colegas podem ser um elogio bem-intencionado.', 'mdish_moral_justification', false, 'asx_5', true),
('assedio_sexual', 3, 'Flertar com colegas é só uma forma de descontrair o ambiente.', 'mdish_euphemistic_labeling', false, 'asx_5', true),
('assedio_sexual', 4, 'Insinuações sexuais no trabalho são apenas “mal-entendidos” entre colegas.', 'mdish_euphemistic_labeling', false, 'asx_5', true),
('assedio_sexual', 5, 'Um comentário ofensivo não é nada perto de outras coisas que acontecem por aí.', 'mdish_advantageous_comparison', false, 'asx_5', true),
('assedio_sexual', 6, 'Comparado a casos graves de violência, assédio sexual no trabalho não é tão sério.', 'mdish_advantageous_comparison', false, 'asx_5', true),
('assedio_sexual', 7, 'Quando o chefe insinua algo de cunho sexual, a culpa é do clima permissivo da empresa, não dele.', 'mdish_displacement_responsibility', false, 'asx_5', true),
('assedio_sexual', 8, 'Se o trabalhador foi pressionado pela chefia a aceitar uma insinuação, ele não pode ser responsabilizado pelo que fez.', 'mdish_displacement_responsibility', false, 'asx_5', true),
('assedio_sexual', 9, 'Quando vários colegas fazem piadas sexuais, ninguém em específico tem culpa.', 'mdish_diffusion_responsibility', false, 'asx_5', true),
('assedio_sexual', 10, 'Numa equipe inteira que ri das brincadeiras, não dá para culpar uma pessoa só.', 'mdish_diffusion_responsibility', false, 'asx_5', true),
('assedio_sexual', 11, 'A maioria das mulheres exagera quando se sente assediada no trabalho.', 'mdish_distortion_consequences', false, 'asx_5', true),
('assedio_sexual', 12, 'Comentários sexuais no trabalho não causam danos reais às pessoas envolvidas.', 'mdish_distortion_consequences', false, 'asx_5', true),
('assedio_sexual', 13, 'Pessoas que se vestem de forma provocante no trabalho estão pedindo esse tipo de atenção.', 'mdish_attribution_blame', false, 'asx_5', true),
('assedio_sexual', 14, 'Quem é assediado costuma ter dado abertura para isso.', 'mdish_attribution_blame', false, 'asx_5', true),
('assedio_sexual', 15, 'Algumas colegas se comportam como se fossem objetos, então recebem esse tipo de comentário.', 'mdish_dehumanization', false, 'asx_5', true),
('assedio_sexual', 16, 'Tem gente que parece existir só para chamar atenção sexual no trabalho.', 'mdish_dehumanization', false, 'asx_5', true),
('assedio_sexual', 17, 'Brincadeiras de cunho sexual fazem parte da cultura de qualquer ambiente de trabalho.', 'mdish_moral_justification', false, 'asx_5', true),
('assedio_sexual', 18, 'Chamar alguém de “gostosa(o)” no trabalho é só uma forma de elogio, não assédio.', 'mdish_euphemistic_labeling', false, 'asx_5', true),

-- SHRAS — atitudes em relação à denúncia / clima organizacional (10 itens)
-- itens "positivos" (concordar = clima saudável) e itens "negativos" reversos
('assedio_sexual', 19, 'Eu confio que minha empresa levaria a sério uma denúncia de assédio sexual.', 'shras', false, 'asx_5', true),
('assedio_sexual', 20, 'Sinto que posso denunciar assédio sexual aqui sem medo de retaliação.', 'shras', false, 'asx_5', true),
('assedio_sexual', 21, 'Os canais de denúncia da minha empresa são claros e acessíveis.', 'shras', false, 'asx_5', true),
('assedio_sexual', 22, 'A liderança da minha empresa demonstra, na prática, tolerância zero com assédio sexual.', 'shras', false, 'asx_5', true),
('assedio_sexual', 23, 'Denúncias de assédio sexual costumam ser investigadas de forma justa nesta empresa.', 'shras', false, 'asx_5', true),
('assedio_sexual', 24, 'Quem denuncia assédio sexual aqui é apoiado(a) pelos colegas e pela chefia.', 'shras', false, 'asx_5', true),
('assedio_sexual', 25, 'Aqui, denunciar assédio sexual pode prejudicar a carreira de quem denuncia.', 'shras', true, 'asx_5', true),
('assedio_sexual', 26, 'Tenho receio de não ser acreditado(a) se relatar um caso de assédio sexual.', 'shras', true, 'asx_5', true),
('assedio_sexual', 27, 'Sei a quem recorrer dentro da empresa em caso de assédio sexual.', 'shras', false, 'asx_5', true),
('assedio_sexual', 28, 'Sinto-se mais seguro(a) ignorar do que relatar um caso de assédio sexual aqui.', 'shras', true, 'asx_5', true);
