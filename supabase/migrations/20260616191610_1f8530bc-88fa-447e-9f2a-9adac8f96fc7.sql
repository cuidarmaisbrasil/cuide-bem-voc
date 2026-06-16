
CREATE POLICY "Public read TAT images"
ON storage.objects FOR SELECT
USING (bucket_id = 'tat-images');

CREATE POLICY "Admins upload TAT images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tat-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update TAT images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tat-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete TAT images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tat-images' AND public.has_role(auth.uid(), 'admin'));
