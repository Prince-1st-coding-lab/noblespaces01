import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Testimonial = {
  id: string;
  name: string;
  rating: number;
  body: string;
  image_url: string | null;
  role_label: string | null;
  status: string;
  sort_order: number;
  created_at: string;
};

/** Resolves storage paths to signed URLs; passes through absolute URLs. */
const resolveImages = async (rows: Testimonial[]): Promise<Testimonial[]> => {
  const paths = rows
    .map((r) => r.image_url)
    .filter((u): u is string => !!u && !u.startsWith("http"));
  if (paths.length === 0) return rows;

  const { data } = await supabase.storage.from("media").createSignedUrls(paths, 60 * 60);
  const map = new Map<string, string>();
  (data ?? []).forEach((d) => {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  });
  return rows.map((r) =>
    r.image_url && map.has(r.image_url) ? { ...r, image_url: map.get(r.image_url)! } : r,
  );
};

export const useApprovedTestimonials = () =>
  useQuery({
    queryKey: ["testimonials", "approved"],
    queryFn: async (): Promise<Testimonial[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "approved")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return resolveImages((data ?? []) as Testimonial[]);
    },
    staleTime: 60_000,
  });

export const uploadTestimonialAvatar = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `testimonials/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
};
