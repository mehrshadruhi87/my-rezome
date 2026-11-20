import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resetSupabaseClientForTests,
  setSupabaseClientForTests,
} from "./supabase";
import {
  getSupabaseAdminSyncStatus,
  isCoursePubliclyVisible,
  normalizeModerationStatus,
  resetSupabaseAdminSyncStatusForTests,
} from "./supabaseAdminSync";
import {
  createMemoryStorage,
  dispatchLocalApiRequest,
  readLocalDb,
  signLocalToken,
  writeLocalDb,
} from "./localBackend";
import { getDictionary } from "./i18n";
import { sanitizeUserPreferences } from "../utils/userPreferences";
import type { CourseSummary, ContentSubmissionItem } from "../types";

function createAdminMockSupabase(options?: { missingTables?: string[] }) {
  const missing = new Set(options?.missingTables ?? []);
  const store: Record<string, Record<string, unknown>[]> = {
    courses: [],
    categories: [],
    discount_codes: [],
    site_settings: [],
    content_submissions: [],
    instructors: [],
    users: [],
    orders: [],
    reviews: [],
    news: [],
  };

  function makeBuilder(tableName: string) {
    let filters: Array<{ col: string; val: unknown }> = [];
    let upsertPayload: Record<string, unknown> | null = null;
    let insertPayload: Record<string, unknown> | null = null;
    let updatePayload: Record<string, unknown> | null = null;
    let isDelete = false;

    const execute = async (mode: "many" | "single" | "maybeSingle") => {
      if (missing.has(tableName)) {
        return {
          data: null,
          error: {
            code: "PGRST205",
            message: `Could not find the table 'public.${tableName}' in the schema cache`,
          },
        };
      }

      if (!store[tableName]) store[tableName] = [];
      const rows = store[tableName];

      if (upsertPayload) {
        const idx = rows.findIndex((r) => r.id === upsertPayload!.id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...upsertPayload };
        } else {
          rows.unshift({ ...upsertPayload });
        }
        return { data: upsertPayload, error: null };
      }

      if (insertPayload) {
        rows.unshift({ ...insertPayload });
        return { data: insertPayload, error: null };
      }

      if (updatePayload) {
        const matched = rows.filter((r) =>
          filters.every((f) => r[f.col] === f.val)
        );
        for (const r of matched) {
          Object.assign(r, updatePayload);
        }
        return {
          data: mode === "many" ? matched : matched[0] ?? null,
          error: null,
        };
      }

      if (isDelete) {
        store[tableName] = rows.filter(
          (r) => !filters.every((f) => r[f.col] === f.val)
        );
        return { data: null, error: null };
      }

      const matched = rows.filter((r) =>
        filters.every((f) => r[f.col] === f.val)
      );
      if (mode === "many") return { data: matched, error: null };
      if (mode === "maybeSingle") return { data: matched[0] ?? null, error: null };
      return matched[0]
        ? { data: matched[0], error: null }
        : { data: null, error: { code: "PGRST116", message: "Not found" } };
    };

    const builder: Record<string, unknown> = {
      select() {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push({ col, val });
        return builder;
      },
      order() {
        return builder;
      },
      upsert(payload: Record<string, unknown>) {
        upsertPayload = payload;
        return builder;
      },
      insert(payload: Record<string, unknown>) {
        insertPayload = payload;
        return builder;
      },
      update(payload: Record<string, unknown>) {
        updatePayload = payload;
        return builder;
      },
      delete() {
        isDelete = true;
        return builder;
      },
      maybeSingle() {
        return execute("maybeSingle");
      },
      single() {
        return execute("single");
      },
      then(
        onFulfilled: (val: unknown) => unknown,
        onRejected?: (err: unknown) => unknown
      ) {
        return execute("many").then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return {
    store,
    client: {
      from(tableName: string) {
        return makeBuilder(tableName);
      },
    } as unknown as SupabaseClient,
  };
}

test("isCoursePubliclyVisible strictly enforces approved moderation status and isPublished", () => {
  assert.equal(
    isCoursePubliclyVisible({ isPublished: true, moderationStatus: "approved" }),
    true
  );
  assert.equal(
    isCoursePubliclyVisible({ isPublished: true, moderationStatus: "pending" }),
    false
  );
  assert.equal(
    isCoursePubliclyVisible({ isPublished: true, moderationStatus: "rejected" }),
    false
  );
  assert.equal(
    isCoursePubliclyVisible({ isPublished: false, moderationStatus: "approved" }),
    false
  );
  assert.equal(normalizeModerationStatus("PENDING", "approved"), "pending");
  assert.equal(normalizeModerationStatus("invalid", "pending"), "pending");
});

test("Instructor course creation & lesson edits stay pending until Super Admin approves", async () => {
  const mock = createAdminMockSupabase();
  setSupabaseClientForTests(mock.client);
  resetSupabaseAdminSyncStatusForTests();

  try {
    const storage = createMemoryStorage();
    const db = readLocalDb(storage);
    const instructorId = "usr_inst_test_1";
    db.users.push({
      id: instructorId,
      name: "مهندس سارا کریمی",
      email: "sara.instructor@example.com",
      passwordHash: "hash",
      role: "INSTRUCTOR",
      phone: "09120000001",
      bio: "مدرس ارشد React",
      isActive: true,
      isEmailVerified: true,
      instructorStatus: "approved",
      createdAt: new Date().toISOString(),
    });
    writeLocalDb(db, storage);

    const instructorHeaders = {
      Authorization: `Bearer ${signLocalToken(instructorId)}`,
    };
    const adminHeaders = {
      Authorization: `Bearer ${signLocalToken("usr_admin_1")}`,
    };

    // 1. Instructor tries to create a published course -> forced to pending & unpublished
    const createRes = await dispatchLocalApiRequest<{
      course: CourseSummary;
      submission: ContentSubmissionItem;
      pendingApproval: boolean;
    }>(
      "/api/admin/courses",
      {
        method: "POST",
        headers: instructorHeaders,
        body: JSON.stringify({
          title: "معماری پیشرفته Rust در تولید",
          shortDesc: "آموزش پروژه‌محور Rust",
          categoryId: db.categories[0].id,
          price: 3900000,
          isPublished: true,
          isFeatured: true,
        }),
      },
      storage
    );

    assert.equal(createRes.pendingApproval, true);
    assert.equal(createRes.course.moderationStatus, "pending");
    assert.equal(createRes.course.isPublished, false);
    assert.equal(createRes.submission.status, "pending");
    assert.equal(mock.store.courses.length, 1);
    assert.equal(mock.store.content_submissions.length, 1);

    // 2. Public storefront & search MUST NOT expose pending course
    const publicList = await dispatchLocalApiRequest<{ courses: CourseSummary[] }>(
      "/api/courses",
      { method: "GET" },
      storage
    );
    assert.equal(
      publicList.courses.some((c) => c.id === createRes.course.id),
      false
    );

    const publicSearch = await dispatchLocalApiRequest<{
      courses: CourseSummary[];
    }>("/api/courses/search?q=Rust", { method: "GET" }, storage);
    assert.equal(publicSearch.courses.length, 0);

    // 3. Instructor CAN see their own pending course in their dashboard list
    const instList = await dispatchLocalApiRequest<{ courses: CourseSummary[] }>(
      "/api/courses?includeUnpublished=true",
      { method: "GET", headers: instructorHeaders },
      storage
    );
    const ownCourse = instList.courses.find((c) => c.id === createRes.course.id);
    assert.ok(ownCourse);
    assert.equal(ownCourse?.moderationStatus, "pending");

    // 4. Super Admin sees pending count in /api/admin/moderation
    const modQueue = await dispatchLocalApiRequest<{
      submissions: ContentSubmissionItem[];
      counts: { pendingContent: number; totalPending: number };
    }>("/api/admin/moderation", { method: "GET", headers: adminHeaders }, storage);
    assert.equal(modQueue.counts.pendingContent, 1);
    assert.equal(modQueue.counts.totalPending, 1);

    // 5. Super Admin rejects with a note -> stays hidden publicly and stores rejectionReason
    const rejectRes = await dispatchLocalApiRequest<{
      course: CourseSummary;
      submission: ContentSubmissionItem;
    }>(
      `/api/admin/moderation/${createRes.submission.id}`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: "کیفیت صدای جلسه اول نیاز به اصلاح دارد.",
        }),
      },
      storage
    );
    assert.equal(rejectRes.course.moderationStatus, "rejected");
    assert.equal(rejectRes.course.isPublished, false);
    assert.equal(
      rejectRes.course.rejectionReason,
      "کیفیت صدای جلسه اول نیاز به اصلاح دارد."
    );

    const publicAfterReject = await dispatchLocalApiRequest<{
      courses: CourseSummary[];
    }>("/api/courses", { method: "GET" }, storage);
    assert.equal(
      publicAfterReject.courses.some((c) => c.id === createRes.course.id),
      false
    );

    // 6. Super Admin approves -> becomes published & visible publicly and synced in Supabase
    const approveRes = await dispatchLocalApiRequest<{
      course: CourseSummary;
    }>(
      `/api/admin/moderation/${createRes.submission.id}`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ status: "approved" }),
      },
      storage
    );
    assert.equal(approveRes.course.moderationStatus, "approved");
    assert.equal(approveRes.course.isPublished, true);
    assert.equal(approveRes.course.rejectionReason, null);

    const publicAfterApprove = await dispatchLocalApiRequest<{
      courses: CourseSummary[];
    }>("/api/courses", { method: "GET" }, storage);
    assert.equal(
      publicAfterApprove.courses.some((c) => c.id === createRes.course.id),
      true
    );
  } finally {
    resetSupabaseClientForTests();
    resetSupabaseAdminSyncStatusForTests();
  }
});

test("Super Admin writes persist to Supabase and gracefully record missing tables without crashing", async () => {
  const mock = createAdminMockSupabase({
    missingTables: ["discount_codes", "site_settings"],
  });
  setSupabaseClientForTests(mock.client);
  resetSupabaseAdminSyncStatusForTests();

  try {
    const storage = createMemoryStorage();
    const adminHeaders = {
      Authorization: `Bearer ${signLocalToken("usr_admin_1")}`,
    };

    // Category write succeeds in mocked Supabase
    const catRes = await dispatchLocalApiRequest<{ category: { id: string } }>(
      "/api/admin/categories",
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          name: "مهندسی بلاک‌چین",
          slug: "blockchain-dev",
          icon: "Cpu",
        }),
      },
      storage
    );
    assert.ok(catRes.category.id);
    assert.equal(mock.store.categories.length, 1);

    // Coupon & settings writes hit missing tables -> do NOT throw, record missingTables
    const cpnRes = await dispatchLocalApiRequest<{ coupon: { code: string } }>(
      "/api/admin/coupons",
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          code: "PRO2026",
          type: "PERCENTAGE",
          value: 25,
          maxUses: 50,
        }),
      },
      storage
    );
    assert.equal(cpnRes.coupon.code, "PRO2026");

    await dispatchLocalApiRequest(
      "/api/admin/settings",
      {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({ heroTitle: "آموزش تخصصی مهندسی نرم‌افزار" }),
      },
      storage
    );

    const syncStatus = getSupabaseAdminSyncStatus();
    assert.equal(syncStatus.missingTables.includes("discount_codes"), true);
    assert.equal(syncStatus.missingTables.includes("site_settings"), true);
  } finally {
    resetSupabaseClientForTests();
    resetSupabaseAdminSyncStatusForTests();
  }
});

test("Bilingual dictionary and language preference sanitization work cleanly for FA and EN", () => {
  const fa = getDictionary("fa");
  const en = getDictionary("en");

  assert.equal(fa.nav.learningPaths, "مسیرهای یادگیری");
  assert.equal(en.nav.learningPaths, "Learning Paths");
  assert.equal(fa.auth.forgotPasswordLink, "فراموشی رمز عبور؟");
  assert.equal(en.auth.forgotPasswordLink, "Forgot Password?");
  assert.equal(fa.news.archiveBtn, "آرشیو کامل اخبار");
  assert.equal(en.news.archiveBtn, "Full News Archive");

  const enPrefs = sanitizeUserPreferences({ language: "en" });
  assert.equal(enPrefs.language, "en");
  const fallbackPrefs = sanitizeUserPreferences({ language: "de" as unknown as "fa" });
  assert.equal(fallbackPrefs.language, "fa");
});
