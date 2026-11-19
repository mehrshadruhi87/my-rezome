import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  resetSupabaseClientForTests,
  setSupabaseClientForTests,
} from "./supabase";
import {
  generateUuid,
  mapSupabaseOrderToOrderRecord,
  mapSupabaseUserToPublicUser,
  mergeEnrolledCourses,
  normalizeEnrolledCourses,
  type SupabaseOrderRow,
  type SupabaseUserRow,
} from "./supabaseStore";
import {
  createMemoryStorage,
  dispatchLocalApiRequest,
} from "./localBackend";

function createFakeSupabaseClient(options?: { failWithCode?: string }) {
  const tables: {
    users: SupabaseUserRow[];
    orders: SupabaseOrderRow[];
  } = {
    users: [],
    orders: [],
  };

  function makeQuery(tableName: "users" | "orders") {
    let filters: Array<{ col: string; val: unknown }> = [];
    let orderCol: string | null = null;
    let orderAsc = true;
    let insertPayload: Record<string, unknown> | null = null;
    let updatePayload: Record<string, unknown> | null = null;

    const execute = async (mode: "many" | "single" | "maybeSingle") => {
      if (options?.failWithCode) {
        return {
          data: null,
          error: {
            code: options.failWithCode,
            message: `Simulated error ${options.failWithCode}`,
          },
        };
      }

      const list = tables[tableName] as unknown as Record<string, unknown>[];

      if (insertPayload) {
        if (
          tableName === "users" &&
          list.some(
            (r) =>
              String(r.email || "").toLowerCase() ===
              String(insertPayload?.email || "").toLowerCase()
          )
        ) {
          return {
            data: null,
            error: { code: "23505", message: "duplicate key value" },
          };
        }
        const inserted = { ...insertPayload };
        list.push(inserted);
        return {
          data: mode === "many" ? [inserted] : inserted,
          error: null,
        };
      }

      if (updatePayload) {
        const matched = list.filter((row) =>
          filters.every((f) => row[f.col] === f.val)
        );
        for (const row of matched) {
          Object.assign(row, updatePayload);
        }
        const result = matched[0] ?? null;
        return {
          data: mode === "many" ? matched : result,
          error: null,
        };
      }

      let rows = list.filter((row) =>
        filters.every((f) => row[f.col] === f.val)
      );
      if (orderCol) {
        rows = [...rows].sort((a, b) => {
          const av = String(a[orderCol!] ?? "");
          const bv = String(b[orderCol!] ?? "");
          return orderAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }

      if (mode === "many") return { data: rows, error: null };
      if (mode === "maybeSingle") return { data: rows[0] ?? null, error: null };
      return rows[0]
        ? { data: rows[0], error: null }
        : { data: null, error: { code: "PGRST116", message: "No rows found" } };
    };

    const builder: Record<string, unknown> = {
      select() {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push({ col, val });
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderCol = col;
        orderAsc = opts?.ascending !== false;
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
      single() {
        return execute("single");
      },
      maybeSingle() {
        return execute("maybeSingle");
      },
      then(resolve: (val: unknown) => void, reject?: (err: unknown) => void) {
        return execute("many").then(resolve, reject);
      },
    };
    return builder;
  }

  return {
    tables,
    client: {
      from: (table: "users" | "orders") => makeQuery(table),
    } as unknown as SupabaseClient,
  };
}

test("Supabase client exports the exact fallback credentials", () => {
  assert.equal(DEFAULT_SUPABASE_URL, "https://mmimselvnkdbwjyziehj.supabase.co");
  assert.equal(
    DEFAULT_SUPABASE_ANON_KEY,
    "sb_publishable_aF3xWH-TP-wrVl3BPSoSCw_FUUMq0eX"
  );
  assert.equal(SUPABASE_URL, DEFAULT_SUPABASE_URL);
  assert.equal(SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);
});

test("Supabase mappers normalize enrolled_courses, user rows, and order rows", () => {
  assert.match(
    generateUuid(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  assert.deepEqual(normalizeEnrolledCourses(["c1", "c2", "c1"]), ["c1", "c2"]);
  assert.deepEqual(normalizeEnrolledCourses('["c1","c3"]'), ["c1", "c3"]);
  assert.deepEqual(mergeEnrolledCourses(["c1"], ["c1", "c2"]), ["c1", "c2"]);

  const pubUser = mapSupabaseUserToPublicUser({
    id: "u-1",
    name: "آرمان رضایی",
    email: "ARMAN@TEST.IR",
    password: "hash",
    role: "student",
    enrolled_courses: ["crs-1"],
    created_at: "2026-11-19T10:00:00.000Z",
  });
  assert.equal(pubUser.email, "arman@test.ir");
  assert.equal(pubUser.role, "STUDENT");

  const order = mapSupabaseOrderToOrderRecord(
    {
      id: "12345678-1234-4123-8123-1234567890ab",
      user_email: "arman@test.ir",
      user_name: "آرمان رضایی",
      items: [{ courseId: "crs-1", courseTitle: "Next.js 15", price: 3450000 }],
      total_amount: 3450000,
      status: "COMPLETED",
      created_at: "2026-11-19T10:05:00.000Z",
    },
    []
  );
  assert.equal(order.finalAmount, 3450000);
  assert.equal(order.userEmail, "arman@test.ir");
  assert.equal(order.items[0]?.courseTitle, "Next.js 15");
});

test("Cross-device sync: register & purchase on Device A syncs to Device B and Admin Panel on Device C", async () => {
  const fake = createFakeSupabaseClient();
  setSupabaseClientForTests(fake.client);

  try {
    // Device A: register a brand new student & purchase a course
    const deviceAStorage = createMemoryStorage();
    const reg = await dispatchLocalApiRequest<{
      user: { id: string; email: string; name: string };
      token: string;
    }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          name: "نیلوفر کریمی",
          email: "niloofar@crossdevice.ir",
          password: "password123",
        }),
      },
      deviceAStorage
    );

    assert.equal(fake.tables.users.length, 1);
    assert.equal(fake.tables.users[0].email, "niloofar@crossdevice.ir");

    const catalog = await dispatchLocalApiRequest<{
      courses: Array<{ id: string; slug: string }>;
    }>("/api/courses", {}, deviceAStorage);
    const paidCourse = catalog.courses[0];

    const init = await dispatchLocalApiRequest<{
      orderId: string;
      finalAmount: number;
    }>(
      "/api/checkout/initiate",
      {
        method: "POST",
        body: JSON.stringify({ courseIds: [paidCourse.id] }),
      },
      deviceAStorage
    );

    await dispatchLocalApiRequest(
      "/api/checkout/verify",
      {
        method: "POST",
        body: JSON.stringify({ orderId: init.orderId, status: "SUCCESS" }),
      },
      deviceAStorage
    );

    assert.equal(fake.tables.orders.length, 1);
    assert.equal(fake.tables.orders[0].status, "COMPLETED");
    assert.equal(fake.tables.orders[0].user_email, "niloofar@crossdevice.ir");
    assert.deepEqual(fake.tables.users[0].enrolled_courses, [paidCourse.id]);

    // Device B (fresh empty localStorage): logs in with Device A's credentials and gets enrolled course + order!
    const deviceBStorage = createMemoryStorage();
    const loginB = await dispatchLocalApiRequest<{
      user: { id: string; email: string };
      enrolledCourseIds: string[];
    }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: "niloofar@crossdevice.ir",
          password: "password123",
        }),
      },
      deviceBStorage
    );
    assert.equal(loginB.user.id, reg.user.id);
    assert.deepEqual(loginB.enrolledCourseIds, [paidCourse.id]);

    const dashB = await dispatchLocalApiRequest<{
      enrolledCourses: Array<{ id: string }>;
      orders: Array<{ id: string; status: string; userEmail: string }>;
    }>("/api/student/dashboard", {}, deviceBStorage);
    assert.equal(dashB.enrolledCourses.length, 1);
    assert.equal(dashB.enrolledCourses[0].id, paidCourse.id);
    assert.equal(dashB.orders.length, 1);
    assert.equal(dashB.orders[0].status, "COMPLETED");

    // Device C (fresh Admin browser): logs in as Admin and sees Device A's user & order live!
    const deviceCAdminStorage = createMemoryStorage();
    await dispatchLocalApiRequest(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: "mehrshadruhi87@gmail.com",
          password: "mmnn8787",
        }),
      },
      deviceCAdminStorage
    );

    const adminUsers = await dispatchLocalApiRequest<{
      users: Array<{ email: string; enrolledCourseIds: string[]; ordersCount: number }>;
    }>("/api/admin/users", {}, deviceCAdminStorage);
    const syncedStudent = adminUsers.users.find(
      (u) => u.email === "niloofar@crossdevice.ir"
    );
    assert.ok(syncedStudent, "Admin panel must see user registered from Device A");
    assert.deepEqual(syncedStudent.enrolledCourseIds, [paidCourse.id]);
    assert.equal(syncedStudent.ordersCount, 1);

    const adminOrders = await dispatchLocalApiRequest<{
      orders: Array<{ userEmail: string; status: string; finalAmount: number }>;
    }>("/api/admin/orders", {}, deviceCAdminStorage);
    assert.equal(adminOrders.orders.length, 1);
    assert.equal(adminOrders.orders[0].userEmail, "niloofar@crossdevice.ir");
    assert.equal(adminOrders.orders[0].status, "COMPLETED");

    const overview = await dispatchLocalApiRequest<{
      stats: {
        totalStudents: number;
        completedOrdersCount: number;
        totalEnrollments: number;
      };
    }>("/api/admin/overview", {}, deviceCAdminStorage);
    assert.equal(overview.stats.totalStudents, 1);
    assert.equal(overview.stats.completedOrdersCount, 1);
    assert.equal(overview.stats.totalEnrollments, 1);
  } finally {
    resetSupabaseClientForTests();
  }
});

test("Gracefully falls back to local cache when Supabase returns 42501 permission denied", async () => {
  const denied = createFakeSupabaseClient({ failWithCode: "42501" });
  setSupabaseClientForTests(denied.client);

  try {
    const storage = createMemoryStorage();
    const reg = await dispatchLocalApiRequest<{
      user: { email: string };
    }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          name: "سارا fallback",
          email: "sara.fallback@test.ir",
          password: "password123",
        }),
      },
      storage
    );
    assert.equal(reg.user.email, "sara.fallback@test.ir");

    await dispatchLocalApiRequest(
      "/api/auth/logout",
      { method: "POST" },
      storage
    );

    const login = await dispatchLocalApiRequest<{
      user: { email: string };
    }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: "sara.fallback@test.ir",
          password: "password123",
        }),
      },
      storage
    );
    assert.equal(login.user.email, "sara.fallback@test.ir");
  } finally {
    resetSupabaseClientForTests();
  }
});
