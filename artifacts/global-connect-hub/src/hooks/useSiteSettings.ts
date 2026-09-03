import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SettingsMap = Record<string, Record<string, unknown>>;

/** Reads every site setting as a { key: value } map. */
export const useSiteSettings = () => {
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: SettingsMap = {};
      for (const row of data ?? []) {
        map[row.key as string] = (row.value ?? {}) as Record<string, unknown>;
      }
      return map;
    },
    staleTime: 60_000,
  });

  return { settings: query.data ?? {}, isLoading: query.isLoading };
};

/** Reads a single settings group with defaults applied. */
export const useSetting = <T extends Record<string, unknown>>(key: string, fallback: T) => {
  const { settings, isLoading } = useSiteSettings();
  const raw = settings[key];
  const value = useMemo(
    () => ({ ...fallback, ...(raw ?? {}) }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw],
  );
  return { value, isLoading };
};

export const useSaveSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert([{ key, value: value as never }], { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
};
