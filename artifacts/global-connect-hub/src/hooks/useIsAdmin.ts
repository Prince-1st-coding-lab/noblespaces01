import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Lightweight admin check for gating admin-only UI on public pages. */
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async (userId?: string | null) => {
      if (!userId) {
        if (!cancelled) { setIsAdmin(false); setReady(true); }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) { setIsAdmin(!!data); setReady(true); }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => check(session?.user?.id ?? null), 0);
    });
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id ?? null));
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { isAdmin, ready };
};
