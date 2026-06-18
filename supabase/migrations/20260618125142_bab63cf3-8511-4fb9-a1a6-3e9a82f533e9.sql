CREATE POLICY "Public read Rorschach images"
ON storage.objects FOR SELECT
USING (bucket_id = 'rorschach-images');

CREATE POLICY "Admins upload Rorschach images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'rorschach-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update Rorschach images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'rorschach-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete Rorschach images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'rorschach-images' AND has_role(auth.uid(), 'admin'::app_role));