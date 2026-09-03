
-- Lock down notifications: only the system (triggers) may insert
DROP POLICY IF EXISTS "system creates notifications" ON public.notifications;
REVOKE INSERT ON public.notifications FROM anon;
REVOKE INSERT ON public.notifications FROM authenticated;

CREATE OR REPLACE FUNCTION public.notify_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
  v_link text;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    v_title := 'New order received';
    v_body := coalesce(NEW.customer_name, NEW.email, 'A customer') || ' — RWF ' || coalesce(NEW.total, NEW.amount, 0);
    v_link := '/admin/orders';
  ELSIF TG_TABLE_NAME = 'quote_requests' THEN
    v_title := 'New quotation request';
    v_body := NEW.name || coalesce(' — ' || NEW.service_slug, '');
    v_link := '/admin/quotes';
  ELSIF TG_TABLE_NAME = 'contact_messages' THEN
    v_title := 'New contact message';
    v_body := NEW.name || coalesce(': ' || NEW.subject, '');
    v_link := '/admin/messages';
  ELSIF TG_TABLE_NAME = 'testimonials' THEN
    v_title := 'New testimonial submitted';
    v_body := NEW.name || ' — ' || NEW.rating || '/5';
    v_link := '/admin/testimonials';
  ELSIF TG_TABLE_NAME = 'bookings' THEN
    v_title := 'New booking';
    v_body := coalesce(NEW.customer_name, 'A customer') || ' — ' || NEW.service_name;
    v_link := '/admin/bookings';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (type, title, body, entity_type, entity_id, link)
  VALUES (TG_TABLE_NAME, v_title, v_body, TG_TABLE_NAME, NEW.id, v_link);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admin() FROM anon, authenticated, public;

CREATE TRIGGER trg_notify_orders AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_admin();
CREATE TRIGGER trg_notify_quotes AFTER INSERT ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.notify_admin();
CREATE TRIGGER trg_notify_messages AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.notify_admin();
CREATE TRIGGER trg_notify_testimonials AFTER INSERT ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.notify_admin();
CREATE TRIGGER trg_notify_bookings AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_admin();

-- Low stock notification
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stock <= NEW.low_stock_threshold AND (TG_OP = 'INSERT' OR OLD.stock > OLD.low_stock_threshold) THEN
    INSERT INTO public.notifications (type, title, body, entity_type, entity_id, link)
    VALUES ('low_stock', 'Low stock alert', NEW.name || ' — ' || NEW.stock || ' left', 'products', NEW.id, '/admin/products');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_low_stock() FROM anon, authenticated, public;
CREATE TRIGGER trg_notify_low_stock AFTER INSERT OR UPDATE OF stock ON public.products FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();

-- Order items must belong to a real order
DROP POLICY IF EXISTS "anyone adds order items" ON public.order_items;
CREATE POLICY "order items must belong to an order" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));
