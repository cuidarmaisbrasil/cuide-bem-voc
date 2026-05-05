CREATE TABLE public.retest_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  severity text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retest_reminders_pending
  ON public.retest_reminders (scheduled_at)
  WHERE status = 'pending';

ALTER TABLE public.retest_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can schedule a reminder"
  ON public.retest_reminders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) > 3
    AND char_length(email) <= 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND scheduled_at > now()
    AND status = 'pending'
  );

CREATE POLICY "Admins can view reminders"
  ON public.retest_reminders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));