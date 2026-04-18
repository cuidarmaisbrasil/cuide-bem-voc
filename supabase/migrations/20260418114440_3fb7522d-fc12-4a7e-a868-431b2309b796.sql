CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL CHECK (char_length(message) <= 140 AND char_length(message) > 0),
  severity TEXT,
  score INTEGER,
  country TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (char_length(message) <= 140 AND char_length(message) > 0);

CREATE POLICY "Admins can view feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));