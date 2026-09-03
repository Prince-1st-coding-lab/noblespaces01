import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ServicePhoto = { slug: string; url: string };

/**
 * All uploaded service photos (private bucket -> signed URLs), grouped by service slug.
 * Used by the gallery so uploaded images appear site-wide.
 */
export const useServicePhotos = () => {
  const query = useQuery({
    queryKey: ["service-photos", "all"],
    queryFn: async (): Promise<ServicePhoto[]> => {
      const { data, error } = await supabase
        .from("service_photos")
        .select("service_slug,storage_path,sort_order,created_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as { service_slug: string; storage_path: string }[];
      if (!rows.length) return [];

      const signed: ServicePhoto[] = [];
      // Sign in chunks to stay well within request limits.
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const { data: urls } = await supabase.storage
          .from("service-photos")
          .createSignedUrls(slice.map((r) => r.storage_path), 60 * 60 * 24 * 7);
        (urls ?? []).forEach((u) => {
          if (!u.signedUrl || !u.path) return;
          const row = slice.find((r) => r.storage_path === u.path);
          if (row) signed.push({ slug: row.service_slug, url: u.signedUrl });
        });
      }
      return signed;
    },
    staleTime: 5 * 60_000,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
};
