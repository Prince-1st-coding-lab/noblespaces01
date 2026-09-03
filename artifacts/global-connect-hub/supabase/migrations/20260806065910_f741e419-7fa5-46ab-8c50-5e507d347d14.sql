REVOKE EXECUTE ON FUNCTION public.notify_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_low_stock() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;