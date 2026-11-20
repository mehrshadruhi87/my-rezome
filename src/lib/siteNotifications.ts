import { getSupabaseClient } from "./supabase";

export interface LiveNotification {
  id: string;
  title: string;
  message: string;
  promoCode: string;
  ctaLabel: string;
  ctaLink: string;
  isActive: boolean;
  updatedAt: string;
}

export interface SupabaseSiteNotificationRow {
  id: string;
  title: string;
  message: string;
  promo_code: string | null;
  cta_label: string | null;
  cta_link: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface FetchLiveNotificationResult {
  notification: LiveNotification;
  source: "supabase" | "local";
  table?: "site_notifications" | "site_settings";
  missingTable?: boolean;
  errorMessage?: string;
}

export interface SaveLiveNotificationResult {
  ok: boolean;
  notification: LiveNotification;
  syncedToSupabase: boolean;
  table?: "site_notifications" | "site_settings";
  missingTable?: boolean;
  errorMessage?: string;
}

export const PRIMARY_NOTIFICATION_ID = "primary-promo";
export const LIVE_NOTIFICATION_STORAGE_KEY =
  "codeacademy_live_notification_v1";
export const LIVE_NOTIFICATION_DISMISSED_KEY =
  "codeacademy_live_notification_dismissed_v1";
export const LIVE_NOTIFICATION_EVENT = "codeacademy:live-notification-updated";

export const DEFAULT_LIVE_NOTIFICATION: LiveNotification = {
  id: PRIMARY_NOTIFICATION_ID,
  title: "جشنواره ویژه کدآکادمی",
  message:
    "۳۰٪ تخفیف ویژه روی تمام بوت‌کمپ‌ها و دوره‌های تخصصی برنامه‌نویسی و هوش مصنوعی",
  promoCode: "BAHAR30",
  ctaLabel: "مشاهده دوره‌ها",
  ctaLink: "/courses",
  isActive: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const SITE_NOTIFICATIONS_SQL_SETUP = `CREATE TABLE IF NOT EXISTS public.site_notifications (
  id TEXT PRIMARY KEY DEFAULT 'primary-promo',
  title TEXT NOT NULL DEFAULT 'جشنواره ویژه کدآکادمی',
  message TEXT NOT NULL,
  promo_code TEXT DEFAULT '',
  cta_label TEXT DEFAULT 'مشاهده دوره‌ها',
  cta_link TEXT DEFAULT '/courses',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_notifications" ON public.site_notifications;
CREATE POLICY "Allow public read site_notifications"
  ON public.site_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write site_notifications" ON public.site_notifications;
CREATE POLICY "Allow admin write site_notifications"
  ON public.site_notifications FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_notifications TO anon, authenticated;`;

export function normalizePromoCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);
}

export function normalizeLiveNotification(
  raw?: Partial<LiveNotification> | Partial<SupabaseSiteNotificationRow> | null
): LiveNotification {
  const src = (raw ?? {}) as Record<string, unknown>;
  const id =
    typeof src.id === "string" && src.id.trim()
      ? src.id.trim()
      : PRIMARY_NOTIFICATION_ID;

  const rawTitle = typeof src.title === "string" ? src.title.trim() : "";
  const rawMessage = typeof src.message === "string" ? src.message.trim() : "";
  const rawPromo =
    typeof src.promoCode === "string"
      ? src.promoCode
      : typeof src.promo_code === "string"
      ? src.promo_code
      : "";
  const rawCtaLabel =
    typeof src.ctaLabel === "string"
      ? src.ctaLabel.trim()
      : typeof src.cta_label === "string"
      ? src.cta_label.trim()
      : "";
  const rawCtaLink =
    typeof src.ctaLink === "string"
      ? src.ctaLink.trim()
      : typeof src.cta_link === "string"
      ? src.cta_link.trim()
      : "";

  const isActive =
    typeof src.isActive === "boolean"
      ? src.isActive
      : typeof src.is_active === "boolean"
      ? src.is_active
      : DEFAULT_LIVE_NOTIFICATION.isActive;

  const updatedAt =
    typeof src.updatedAt === "string" && src.updatedAt.trim()
      ? src.updatedAt.trim()
      : typeof src.updated_at === "string" && src.updated_at.trim()
      ? src.updated_at.trim()
      : new Date().toISOString();

  return {
    id,
    title: rawTitle || DEFAULT_LIVE_NOTIFICATION.title,
    message: rawMessage || DEFAULT_LIVE_NOTIFICATION.message,
    promoCode: normalizePromoCode(rawPromo),
    ctaLabel: rawCtaLabel || DEFAULT_LIVE_NOTIFICATION.ctaLabel,
    ctaLink: rawCtaLink || DEFAULT_LIVE_NOTIFICATION.ctaLink,
    isActive,
    updatedAt,
  };
}

export function getNotificationSignature(n: LiveNotification): string {
  return [
    n.id,
    n.title.trim(),
    n.message.trim(),
    n.promoCode.trim().toUpperCase(),
    n.ctaLink.trim(),
  ].join("|");
}

export function shouldShowLiveNotification(
  notification: LiveNotification | null,
  dismissedSignature: string | null
): boolean {
  if (!notification || !notification.isActive) return false;
  if (!notification.message.trim() && !notification.promoCode.trim()) {
    return false;
  }
  const sig = getNotificationSignature(notification);
  return dismissedSignature !== sig;
}

export function isMissingTableOrPermissionError(error?: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const code = String(error.code || "").toUpperCase();
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42501" ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("permission denied")
  );
}

export function loadLocalLiveNotification(): LiveNotification {
  if (typeof window === "undefined") return { ...DEFAULT_LIVE_NOTIFICATION };
  try {
    const raw = window.localStorage.getItem(LIVE_NOTIFICATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LIVE_NOTIFICATION };
    const parsed = JSON.parse(raw) as Partial<LiveNotification>;
    return normalizeLiveNotification(parsed);
  } catch {
    return { ...DEFAULT_LIVE_NOTIFICATION };
  }
}

export function saveLocalLiveNotification(
  notification: LiveNotification
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LIVE_NOTIFICATION_STORAGE_KEY,
      JSON.stringify(notification)
    );
    window.dispatchEvent(
      new CustomEvent(LIVE_NOTIFICATION_EVENT, { detail: notification })
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function loadDismissedNotificationSignature(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LIVE_NOTIFICATION_DISMISSED_KEY);
  } catch {
    return null;
  }
}

export function saveDismissedNotificationSignature(signature: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIVE_NOTIFICATION_DISMISSED_KEY, signature);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearDismissedNotificationSignature(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LIVE_NOTIFICATION_DISMISSED_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function fetchLiveNotificationFromSupabase(): Promise<FetchLiveNotificationResult> {
  const client = getSupabaseClient();
  const fallback = loadLocalLiveNotification();

  if (!client) {
    return { notification: fallback, source: "local" };
  }

  // 1. Primary table: public.site_notifications
  try {
    const { data, error } = await client
      .from("site_notifications")
      .select(
        "id, title, message, promo_code, cta_label, cta_link, is_active, updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) {
      if (data) {
        const normalized = normalizeLiveNotification(
          data as SupabaseSiteNotificationRow
        );
        saveLocalLiveNotification(normalized);
        return {
          notification: normalized,
          source: "supabase",
          table: "site_notifications",
        };
      }
      return {
        notification: fallback,
        source: "supabase",
        table: "site_notifications",
      };
    }

    // 2. Fallback table: public.site_settings (key = 'live_notification')
    if (isMissingTableOrPermissionError(error)) {
      const settingsRes = await client
        .from("site_settings")
        .select("key, value, updated_at")
        .eq("key", "live_notification")
        .maybeSingle();

      if (!settingsRes.error && settingsRes.data) {
        const row = settingsRes.data as {
          value?: unknown;
          updated_at?: string;
        };
        const valueObj =
          typeof row.value === "string"
            ? (JSON.parse(row.value) as Partial<LiveNotification>)
            : (row.value as Partial<LiveNotification>);
        const normalized = normalizeLiveNotification({
          ...valueObj,
          updatedAt: row.updated_at || valueObj?.updatedAt,
        });
        saveLocalLiveNotification(normalized);
        return {
          notification: normalized,
          source: "supabase",
          table: "site_settings",
        };
      }

      return {
        notification: fallback,
        source: "local",
        missingTable: true,
        errorMessage: error.message,
      };
    }

    return {
      notification: fallback,
      source: "local",
      errorMessage: error.message,
    };
  } catch (err) {
    return {
      notification: fallback,
      source: "local",
      errorMessage:
        err instanceof Error ? err.message : "خطا در ارتباط با Supabase",
    };
  }
}

export async function saveLiveNotificationToSupabase(
  input: Omit<LiveNotification, "id" | "updatedAt"> & { id?: string }
): Promise<SaveLiveNotificationResult> {
  const now = new Date().toISOString();
  const normalized = normalizeLiveNotification({
    ...input,
    id: input.id || PRIMARY_NOTIFICATION_ID,
    updatedAt: now,
  });

  // Always update local cache immediately and clear local dismissal so updates reflect live
  clearDismissedNotificationSignature();
  saveLocalLiveNotification(normalized);

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: true,
      notification: normalized,
      syncedToSupabase: false,
      errorMessage: "کلاینت Supabase فعال نیست.",
    };
  }

  const rowPayload: SupabaseSiteNotificationRow = {
    id: normalized.id,
    title: normalized.title,
    message: normalized.message,
    promo_code: normalized.promoCode,
    cta_label: normalized.ctaLabel,
    cta_link: normalized.ctaLink,
    is_active: normalized.isActive,
    updated_at: normalized.updatedAt,
  };

  try {
    const { data, error } = await client
      .from("site_notifications")
      .upsert(rowPayload, { onConflict: "id" })
      .select(
        "id, title, message, promo_code, cta_label, cta_link, is_active, updated_at"
      )
      .single();

    if (!error) {
      const saved = data
        ? normalizeLiveNotification(data as SupabaseSiteNotificationRow)
        : normalized;
      saveLocalLiveNotification(saved);
      return {
        ok: true,
        notification: saved,
        syncedToSupabase: true,
        table: "site_notifications",
      };
    }

    // Try secondary table public.site_settings if site_notifications is absent
    if (isMissingTableOrPermissionError(error)) {
      const settingsSave = await client
        .from("site_settings")
        .upsert(
          {
            key: "live_notification",
            value: normalized,
            updated_at: normalized.updatedAt,
          },
          { onConflict: "key" }
        )
        .select("key")
        .maybeSingle();

      if (!settingsSave.error) {
        return {
          ok: true,
          notification: normalized,
          syncedToSupabase: true,
          table: "site_settings",
        };
      }

      return {
        ok: true,
        notification: normalized,
        syncedToSupabase: false,
        missingTable: true,
        errorMessage: error.message,
      };
    }

    return {
      ok: false,
      notification: normalized,
      syncedToSupabase: false,
      errorMessage: error.message,
    };
  } catch (err) {
    return {
      ok: false,
      notification: normalized,
      syncedToSupabase: false,
      errorMessage:
        err instanceof Error ? err.message : "خطا در ذخیره در Supabase",
    };
  }
}
