CREATE TABLE public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  service_name text not null,
  booking_date date not null,
  time_slot text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users insert own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users update own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admins read all bookings" ON public.bookings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update all bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX bookings_order_id_idx ON public.bookings(order_id);
CREATE INDEX bookings_status_idx ON public.bookings(status);

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;