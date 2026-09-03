import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES as LOCAL_SERVICES, type ResolvedService } from "@/data/services";

/**
 * Unified service shape used across the UI. Services now live in the
 * Supabase `services` table (managed by admin). Bundled local data is used
 * as a fallback and to provide icon components + built-in gallery images.
 */
export type UiService = {
  slug: string;
  title?: string;
  description?: string;
  icon: LucideIcon;
  availability: "both" | "custom" | "service";
  leadTimeDays: [number, number];
  cover: string;
  gallery: string[];
  hidden?: boolean;
};

const DefaultIcon = Icons.Sparkles;

const resolveIcon = (name?: string | null): LucideIcon => {
  if (!name) return DefaultIcon;
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name];
  return Icon ?? DefaultIcon;
};

type DbService = {
  slug: string;
  title: string | null;
  description: string | null;
  icon: string | null;
  availability: "both" | "custom" | "service";
  lead_time_min: number;
  lead_time_max: number;
  sort_order: number;
  hidden: boolean;
};

const bundledBySlug = new Map<string, ResolvedService>(
  LOCAL_SERVICES.map((s) => [s.slug, s]),
);

const fromDb = (s: DbService): UiService => {
  const bundled = bundledBySlug.get(s.slug);
  return {
    slug: s.slug,
    title: s.title ?? undefined,
    description: s.description ?? undefined,
    icon: bundled?.icon ?? resolveIcon(s.icon),
    availability: s.availability,
    leadTimeDays: [s.lead_time_min, s.lead_time_max],
    cover: bundled?.cover ?? "",
    gallery: bundled?.gallery ?? [],
    hidden: s.hidden,
  };
};

const fromLocal = (s: ResolvedService): UiService => ({
  slug: s.slug,
  icon: s.icon,
  availability: s.availability,
  leadTimeDays: s.leadTimeDays,
  cover: s.cover,
  gallery: s.gallery,
});

const LOCAL_FALLBACK: UiService[] = LOCAL_SERVICES.map(fromLocal);

/**
 * @param includeHidden When true, returns hidden services too (for admin).
 */
export const useServices = (includeHidden = false) => {
  const query = useQuery({
    queryKey: ["services", "catalog"],
    queryFn: async (): Promise<UiService[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as DbService[]).map(fromDb);
    },
    staleTime: 30_000,
  });

  const all = query.data ?? LOCAL_FALLBACK;
  const visible = includeHidden ? all : all.filter((s) => !s.hidden);

  return {
    data: visible,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
};

export const useService = (slug: string) => {
  const { data } = useServices();
  const idx = data.findIndex((s) => s.slug === slug);
  return {
    service: idx >= 0 ? data[idx] : undefined,
    index: idx,
    all: data,
  };
};
