CREATE POLICY "anyone uploads testimonial avatars"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = 'testimonials');

CREATE POLICY "anyone reads testimonial avatars"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'testimonials');