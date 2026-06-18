GRANT INSERT ON public.tat_public_responses TO anon;
CREATE POLICY "Anyone can submit TAT response"
ON public.tat_public_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  narrative IS NOT NULL
  AND length(narrative) BETWEEN 1 AND 20000
  AND request_id IS NOT NULL
);