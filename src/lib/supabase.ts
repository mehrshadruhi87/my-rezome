import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://mmimselvnkdbwjyziehj.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
  "sb_publishable_aF3xWH-TP-wrVl3BPSoSCw_FUUMq0eX";

export const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL &&
    String(import.meta.env.VITE_SUPABASE_URL).trim()) ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY &&
    String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim()) ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

let activeSupabaseClient: SupabaseClient | null = supabase;

export function getSupabaseClient(): SupabaseClient | null {
  return activeSupabaseClient;
}

export function setSupabaseClientForTests(client: SupabaseClient | null): void {
  activeSupabaseClient = client;
}

export function resetSupabaseClientForTests(): void {
  activeSupabaseClient = supabase;
}
