DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.quote_requests TO anon;
GRANT INSERT ON public.testimonials TO anon;
GRANT INSERT ON public.bookings TO anon;
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
REVOKE SELECT ON public.email_log FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.notifications FROM anon;