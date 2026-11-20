import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://mmimselvnkdbwjyziehj.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
  "sb_publishable_aF3xWH-TP-wrVl3BPSoSCw_FUUMq0eX";

function resolveSupabaseEnv(
  rawValue: unknown,
  fallback: string
): string {
  const trimmed = typeof rawValue === "string" ? rawValue.trim() : "";
  if (
    !trimmed ||
    trimmed.includes("PASTE_YOUR_") ||
    trimmed.includes("YOUR_SUPABASE_")
  ) {
    return fallback;
  }
  return trimmed;
}

export const SUPABASE_URL = resolveSupabaseEnv(
  import.meta.env?.VITE_SUPABASE_URL,
  DEFAULT_SUPABASE_URL
);

export const SUPABASE_ANON_KEY = resolveSupabaseEnv(
  import.meta.env?.VITE_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_ANON_KEY
);

export interface AuthStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

function isStorageAccessible(candidate: Storage | null | undefined): candidate is Storage {
  if (!candidate) return false;
  const probeKey = "__codeacademy_auth_storage_probe__";
  try {
    candidate.setItem(probeKey, "1");
    const readBack = candidate.getItem(probeKey);
    candidate.removeItem(probeKey);
    return readBack === "1";
  } catch {
    return false;
  }
}

export function createSafeAuthStorage(
  candidates?: Array<AuthStorageLike | Storage | null | undefined>
): AuthStorageLike {
  const memoryFallback = new Map<string, string>();

  const resolveBackingStorage = (): AuthStorageLike | null => {
    const list: Array<AuthStorageLike | Storage | null | undefined> =
      candidates ??
      (typeof window !== "undefined"
        ? [
            (() => {
              try {
                return window.localStorage;
              } catch {
                return null;
              }
            })(),
            (() => {
              try {
                return window.sessionStorage;
              } catch {
                return null;
              }
            })(),
          ]
        : []);

    for (const store of list) {
      if (!store) continue;
      if (isStorageAccessible(store as Storage)) {
        return store;
      }
    }
    return null;
  };

  let backing = resolveBackingStorage();

  return {
    getItem(key: string): string | null {
      if (backing) {
        try {
          const val = backing.getItem(key);
          if (val !== null) {
            memoryFallback.set(key, val);
            return val;
          }
        } catch {
          backing = null;
        }
      }
      return memoryFallback.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      memoryFallback.set(key, value);
      if (backing) {
        try {
          backing.setItem(key, value);
        } catch {
          backing = null;
        }
      }
    },
    removeItem(key: string): void {
      memoryFallback.delete(key);
      if (backing) {
        try {
          backing.removeItem(key);
        } catch {
          backing = null;
        }
      }
    },
  };
}

const isBrowser = typeof window !== "undefined";
const browserAuthStorage = isBrowser ? createSafeAuthStorage() : undefined;

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isBrowser,
      storage: browserAuthStorage,
    },
  }
);

if (isBrowser) {
  const host = SUPABASE_URL.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  console.info(
    `[Supabase] Connected to ${host} (persistent Auth, auto-refresh & safe iframe storage enabled)`
  );
}

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
