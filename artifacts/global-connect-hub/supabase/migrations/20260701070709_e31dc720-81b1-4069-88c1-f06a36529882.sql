-- Service photos: admin-managed extra images per service
CREATE TABLE public.service_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX service_photos_slug_idx ON public.service_photos(service_slug, sort_order);

GRANT SELECT ON public.service_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_photos TO authenticated;
GRANT ALL ON public.service_photos TO service_role;

ALTER TABLE public.service_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads service photos"
  ON public.service_photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins insert service photos"
  ON public.service_photos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update service photos"
  ON public.service_photos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete service photos"
  ON public.service_photos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER service_photos_updated
  BEFORE UPDATE ON public.service_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for service-photos bucket (bucket created via tool separately).
-- Public read; only admins can write/delete.
CREATE POLICY "public read service-photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'service-photos');
CREATE POLICY "admins upload service-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update service-photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete service-photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-photos' AND public.has_role(auth.uid(), 'admin'));