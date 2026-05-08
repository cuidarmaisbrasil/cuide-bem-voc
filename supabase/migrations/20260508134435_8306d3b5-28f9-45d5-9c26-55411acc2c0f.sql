-- Políticas de SELECT para o papel 'viewer' (somente leitura) nas tabelas do painel
CREATE POLICY "Viewers can view test events" ON public.test_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view link clicks" ON public.link_clicks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view sessions" ON public.sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view feedback" ON public.feedback
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view admin ip hashes" ON public.admin_ip_hashes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all professionals" ON public.professionals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all platforms" ON public.care_platforms
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all severity articles" ON public.severity_articles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view alerts" ON public.system_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view reminders" ON public.retest_reminders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'viewer'));