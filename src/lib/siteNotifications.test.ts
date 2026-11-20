import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resetSupabaseClientForTests,
  setSupabaseClientForTests,
} from "./supabase";
import {
  DEFAULT_LIVE_NOTIFICATION,
  fetchLiveNotificationFromSupabase,
  getNotificationSignature,
  normalizeLiveNotification,
  normalizePromoCode,
  saveLiveNotificationToSupabase,
  shouldShowLiveNotification,
  type SupabaseSiteNotificationRow,
} from "./siteNotifications";

function createFakeNotificationSupabase(options?: {
  missingTable?: boolean;
  useSiteSettingsFallback?: boolean;
}) {
  const siteNotifications: SupabaseSiteNotificationRow[] = [];
  const siteSettings: Array<{ key: string; value: unknown; updated_at: string }> =
    [];

  function makeBuilder(table: string) {
    let upsertPayload: Record<string, unknown> | null = null;
    let eqFilter: { col: string; val: unknown } | null = null;

    const execute = async (mode: "single" | "maybeSingle") => {
      if (table === "site_notifications" && options?.missingTable) {
        return {
          data: null,
          error: {
            code: "PGRST205",
            message:
              "Could not find the table 'public.site_notifications' in the schema cache",
          },
        };
      }

      if (table === "site_settings" && !options?.useSiteSettingsFallback) {
        return {
          data: null,
          error: {
            code: "PGRST205",
            message:
              "Could not find the table 'public.site_settings' in the schema cache",
          },
        };
      }

      if (table === "site_notifications") {
        if (upsertPayload) {
          const row = upsertPayload as unknown as SupabaseSiteNotificationRow;
          const idx = siteNotifications.findIndex((r) => r.id === row.id);
          if (idx >= 0) siteNotifications[idx] = { ...row };
          else siteNotifications.push({ ...row });
          return { data: { ...row }, error: null };
        }
        const sorted = [...siteNotifications].sort((a, b) =>
          b.updated_at.localeCompare(a.updated_at)
        );
        const top = sorted[0] ?? null;
        if (mode === "single" && !top) {
          return { data: null, error: { code: "PGRST116", message: "No rows" } };
        }
        return { data: top, error: null };
      }

      if (table === "site_settings") {
        if (upsertPayload) {
          const row = upsertPayload as {
            key: string;
            value: unknown;
            updated_at: string;
          };
          const idx = siteSettings.findIndex((r) => r.key === row.key);
          if (idx >= 0) siteSettings[idx] = { ...row };
          else siteSettings.push({ ...row });
          return { data: { ...row }, error: null };
        }
        const match = eqFilter
          ? siteSettings.find(
              (r) => (r as Record<string, unknown>)[eqFilter!.col] === eqFilter!.val
            ) ?? null
          : siteSettings[0] ?? null;
        return { data: match, error: null };
      }

      return { data: null, error: { code: "PGRST205", message: "Unknown table" } };
    };

    const builder: Record<string, unknown> = {
      select() {
        return builder;
      },
      order() {
        return builder;
      },
      limit() {
        return builder;
      },
      eq(col: string, val: unknown) {
        eqFilter = { col, val };
        return builder;
      },
      upsert(payload: Record<string, unknown>) {
        upsertPayload = payload;
        return builder;
      },
      single() {
        return execute("single");
      },
      maybeSingle() {
        return execute("maybeSingle");
      },
    };
    return builder;
  }

  return {
    siteNotifications,
    siteSettings,
    client: {
      from: (table: string) => makeBuilder(table),
    } as unknown as SupabaseClient,
  };
}

test("normalizePromoCode and normalizeLiveNotification sanitize inputs cleanly", () => {
  assert.equal(normalizePromoCode("  bahar 30  "), "BAHAR30");
  assert.equal(normalizePromoCode(null), "");

  const normalized = normalizeLiveNotification({
    title: "  تخفیف تابستانی  ",
    message: "  ۴۰٪ تخفیف روی دوره‌های AI  ",
    promo_code: "ai40",
    is_active: true,
  });

  assert.equal(normalized.title, "تخفیف تابستانی");
  assert.equal(normalized.message, "۴۰٪ تخفیف روی دوره‌های AI");
  assert.equal(normalized.promoCode, "AI40");
  assert.equal(normalized.isActive, true);
});

test("shouldShowLiveNotification respects active flag, dismissal, and content updates", () => {
  const notif = { ...DEFAULT_LIVE_NOTIFICATION };
  const sig = getNotificationSignature(notif);

  assert.equal(shouldShowLiveNotification(notif, null), true);
  assert.equal(shouldShowLiveNotification(notif, sig), false);

  // Updating promo code invalidates old dismissal so users see the new campaign
  const updated = { ...notif, promoCode: "WINTER40" };
  assert.equal(shouldShowLiveNotification(updated, sig), true);

  // Inactive notifications are always hidden
  assert.equal(
    shouldShowLiveNotification({ ...notif, isActive: false }, null),
    false
  );
});

test("saveLiveNotificationToSupabase and fetchLiveNotificationFromSupabase persist to site_notifications", async () => {
  const fake = createFakeNotificationSupabase();
  setSupabaseClientForTests(fake.client);

  try {
    const saved = await saveLiveNotificationToSupabase({
      title: "کمپین هوش مصنوعی",
      message: "۲۵٪ تخفیف بوت‌کمپ مهندسی LLM",
      promoCode: "ai25",
      ctaLabel: "ثبت‌نام سریع",
      ctaLink: "/courses?category=ai-data",
      isActive: true,
    });

    assert.equal(saved.ok, true);
    assert.equal(saved.syncedToSupabase, true);
    assert.equal(saved.table, "site_notifications");
    assert.equal(fake.siteNotifications.length, 1);
    assert.equal(fake.siteNotifications[0].promo_code, "AI25");

    const fetched = await fetchLiveNotificationFromSupabase();
    assert.equal(fetched.source, "supabase");
    assert.equal(fetched.table, "site_notifications");
    assert.equal(fetched.notification.title, "کمپین هوش مصنوعی");
    assert.equal(fetched.notification.promoCode, "AI25");
    assert.equal(fetched.notification.isActive, true);
  } finally {
    resetSupabaseClientForTests();
  }
});

test("gracefully reports missingTable when public.site_notifications is not yet created", async () => {
  const fake = createFakeNotificationSupabase({ missingTable: true });
  setSupabaseClientForTests(fake.client);

  try {
    const fetched = await fetchLiveNotificationFromSupabase();
    assert.equal(fetched.source, "local");
    assert.equal(fetched.missingTable, true);

    const saved = await saveLiveNotificationToSupabase({
      title: "اعلان تست",
      message: "متن اعلان تستی",
      promoCode: "TEST10",
      ctaLabel: "مشاهده",
      ctaLink: "/courses",
      isActive: true,
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.syncedToSupabase, false);
    assert.equal(saved.missingTable, true);
  } finally {
    resetSupabaseClientForTests();
  }
});
