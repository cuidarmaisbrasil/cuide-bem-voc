
-- ============ ROLES SYSTEM ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ANALYTICS: TEST EVENTS ============
CREATE TABLE public.test_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT,
  score INTEGER,
  severity TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_test_events_created_at ON public.test_events(created_at DESC);
CREATE INDEX idx_test_events_ip_hash ON public.test_events(ip_hash);
CREATE INDEX idx_test_events_country ON public.test_events(country);

CREATE POLICY "Anyone can insert test events"
ON public.test_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view test events"
ON public.test_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============ ANALYTICS: LINK CLICKS ============
CREATE TABLE public.link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_type TEXT NOT NULL, -- 'professional', 'sus', 'cvv', 'platform'
  target_id TEXT, -- id do profissional/plataforma ou identificador
  target_label TEXT,
  ip_hash TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_link_clicks_created_at ON public.link_clicks(created_at DESC);
CREATE INDEX idx_link_clicks_type ON public.link_clicks(link_type);
CREATE INDEX idx_link_clicks_target ON public.link_clicks(target_id);

CREATE POLICY "Anyone can insert link clicks"
ON public.link_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view link clicks"
ON public.link_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============ PROFESSIONALS ============
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  modality TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'BR',
  price_from TEXT,
  contact TEXT,
  whatsapp TEXT,
  bio TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_professionals_city ON public.professionals(city);
CREATE INDEX idx_professionals_active ON public.professionals(active);

CREATE POLICY "Anyone can view active professionals"
ON public.professionals FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins can view all professionals"
ON public.professionals FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage professionals"
ON public.professionals FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CARE PLATFORMS ============
CREATE TABLE public.care_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  country TEXT NOT NULL,
  url TEXT,
  phone TEXT,
  type TEXT, -- 'public', 'ngo', 'hotline', 'low-cost'
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_platforms ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_care_platforms_country ON public.care_platforms(country);
CREATE INDEX idx_care_platforms_active ON public.care_platforms(active);

CREATE POLICY "Anyone can view active platforms"
ON public.care_platforms FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins can view all platforms"
ON public.care_platforms FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage platforms"
ON public.care_platforms FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SYSTEM ALERTS ============
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'quota', 'volume', 'error'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved);

CREATE POLICY "Admins can view alerts"
ON public.system_alerts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage alerts"
ON public.system_alerts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_platforms_updated_at
BEFORE UPDATE ON public.care_platforms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED DATA ============
INSERT INTO public.professionals (name, title, specialty, modality, city, country, price_from, contact, whatsapp, bio) VALUES
('Espaço Acolher Psicologia', 'Clínica social', 'Depressão, ansiedade e luto', 'Presencial e online', 'São Paulo, SP', 'BR', 'R$ 60', '(11) 0000-0000', '5511000000000', 'Atendimento por psicólogos clínicos formados, com valores sociais a partir de R$ 60 por sessão.'),
('Coletivo Mente Sã', 'Coletivo de psicólogos', 'Transtorno depressivo maior, distimia', 'Online (Brasil todo)', 'Atendimento nacional', 'BR', 'R$ 80', 'contato@exemplo.com', '5511000000000', 'Coletivo focado em democratizar o acesso à psicoterapia. Sessões online com valores acessíveis.'),
('Instituto Equilíbrio', 'Clínica popular', 'Depressão e prevenção do suicídio', 'Presencial', 'Rio de Janeiro, RJ', 'BR', 'R$ 70', '(21) 0000-0000', '5521000000000', 'Equipe de psicólogos e psiquiatras com atendimentos a preços populares e plantão semanal.');

INSERT INTO public.care_platforms (name, description, country, url, phone, type) VALUES
('SUS - CAPS', 'Centros de Atenção Psicossocial - atendimento gratuito em saúde mental pelo SUS', 'BR', 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental', '136', 'public'),
('CVV - Centro de Valorização da Vida', 'Apoio emocional e prevenção do suicídio - 24h gratuito', 'BR', 'https://www.cvv.org.br', '188', 'hotline'),
('SAMU', 'Serviço de Atendimento Móvel de Urgência', 'BR', null, '192', 'hotline');
