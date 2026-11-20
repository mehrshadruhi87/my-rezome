import { getSupabaseClient } from "./supabase";

export const CODEACADEMY_REALTIME_EVENT = "codeacademy:realtime-update";

export interface RealtimeUpdateDetail {
  table: string;
  source: "supabase" | "local";
  timestamp: number;
}

const REALTIME_TABLES = [
  "site_notifications",
  "courses",
  "course_reviews",
  "learning_paths",
  "news",
  "promo_codes",
  "discount_codes",
  "site_settings",
] as const;

export function broadcastLocalRealtimeUpdate(
  table: string,
  source: "supabase" | "local" = "local"
): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<RealtimeUpdateDetail>(CODEACADEMY_REALTIME_EVENT, {
        detail: {
          table,
          source,
          timestamp: Date.now(),
        },
      })
    );
  } catch {
    // Ignore event dispatch failures
  }
}

export function subscribeCodeAcademyRealtime(
  onTableChange: (table: string) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  let channel = client.channel("codeacademy_global_realtime");

  for (const table of REALTIME_TABLES) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      () => {
        broadcastLocalRealtimeUpdate(table, "supabase");
        onTableChange(table);
      }
    );
  }

  channel.subscribe();

  return () => {
    try {
      void client.removeChannel(channel);
    } catch {
      // Ignore unsubscribe errors
    }
  };
}
