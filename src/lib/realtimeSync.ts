import { supabase } from "./supabase";

export const CODEACADEMY_REALTIME_EVENT = "codeacademy:realtime-update";

export const REALTIME_TABLES = [
  "site_notifications",
  "courses",
  "course_reviews",
  "learning_paths",
  "news",
  "promo_codes",
  "discount_codes",
  "site_settings",
  "categories",
] as const;

export type RealtimeTableName = (typeof REALTIME_TABLES)[number];

export interface RealtimeUpdateDetail {
  table: RealtimeTableName;
  eventType: string;
  timestamp: number;
}

export type RealtimeSyncEventDetail = RealtimeUpdateDetail;

export function dispatchRealtimeUpdate(
  table: RealtimeTableName,
  eventType = "UPDATE"
): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<RealtimeUpdateDetail>(CODEACADEMY_REALTIME_EVENT, {
        detail: { table, eventType, timestamp: Date.now() },
      })
    );
  } catch {
    // Ignore event dispatch failures
  }
}

export function subscribeToPlatformRealtime(): () => void {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  try {
    const base = supabase.channel("codeacademy:global-realtime");
    for (const table of REALTIME_TABLES) {
      base.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          dispatchRealtimeUpdate(
            table,
            String((payload as { eventType?: string })?.eventType || "UPDATE")
          );
        }
      );
    }
    channel = base.subscribe();
  } catch {
    // Gracefully ignore when realtime isn't enabled on the project yet
  }

  return () => {
    if (channel) {
      try {
        void supabase.removeChannel(channel);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}
