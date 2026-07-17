import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_RH_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_RH_SUPABASE_ANON_KEY as string | undefined;

export const rhTenantId = (import.meta.env.VITE_RH_TENANT_ID as string | undefined)?.trim() || "";

export const hasRhSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey && rhTenantId);

export const rhSupabase = hasRhSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "happycash-rh-enterprise:auth",
    },
  })
  : null;
