ALTER TABLE public.bookings
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS payment_method text;

GRANT INSERT ON public.bookings TO anon;

CREATE POLICY "anyone can create a booking"
  ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (true);