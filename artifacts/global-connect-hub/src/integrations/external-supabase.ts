// External Supabase project (data + auth for promoters / payments / admin).
// Credentials are intentionally read only from environment variables.
import { createClient } from "@supabase/supabase-js";

export const EXTERNAL_SUPABASE_URL =
  import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined;

export const EXTERNAL_SUPABASE_ANON_KEY =
  import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined;

export const externalSupabase =
  EXTERNAL_SUPABASE_URL && EXTERNAL_SUPABASE_ANON_KEY
    ? createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "noble-external-auth",
        },
      })
    : null;

export type Promoter = {
  id: string;
  name: string | null;
  phone: string | null;
  referral_code: string;
  created_at: string;
};

export type Payment = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  amount: number;
  referral_code: string | null;
  promoter_id: string | null;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
};

export type PaymentLink = {
  id: string;
  label: string;
  amount: number;
  url: string;
  active: boolean;
  created_at: string;
};