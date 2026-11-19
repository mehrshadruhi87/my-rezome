import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_EMAIL,
  AUTH_TOKEN_KEY,
  LocalApiError,
  authenticateAdminLogin,
  buildSeedData,
  createMemoryStorage,
  dispatchLocalApiRequest,
} from "./localBackend";
import {
  resetSupabaseClientForTests,
  setSupabaseClientForTests,
} from "./supabase";
import type { CategoryItem, CourseSummary, PublicUser } from "../types";

before(() => {
  setSupabaseClientForTests(null);
});
after(() => {
  resetSupabaseClientForTests();
});

test("seeds initial categories and courses into storage on bootstrap", async () => {
  const storage = createMemoryStorage();
  const bootstrap = await dispatchLocalApiRequest<{
    categories: CategoryItem[];
    user: PublicUser | null;
    enrolledCourseIds: string[];
  }>("/api/bootstrap", {}, storage);

  assert.equal(bootstrap.categories.length, 6);
  assert.equal(bootstrap.user, null);
  assert.deepEqual(bootstrap.enrolledCourseIds, []);

  const catalog = await dispatchLocalApiRequest<{ courses: CourseSummary[] }>(
    "/api/courses",
    {},
    storage
  );
  assert.equal(catalog.courses.length, 6);
});

test("requires public registration before login and enforces dedicated admin login", async () => {
  const storage = createMemoryStorage();

  // Direct unit check on dedicated authenticateAdminLogin
  const seedDb = buildSeedData();
  assert.throws(
    () => authenticateAdminLogin("other@example.com", "mmnn8787", seedDb),
    (err: unknown) => err instanceof LocalApiError && err.status === 403
  );
  assert.throws(
    () => authenticateAdminLogin(ADMIN_EMAIL, "wrongpass", seedDb),
    (err: unknown) => err instanceof LocalApiError && err.status === 401
  );
  const authenticatedAdmin = authenticateAdminLogin(
    ADMIN_EMAIL,
    "mmnn8787",
    seedDb
  );
  assert.equal(authenticatedAdmin.role, "ADMIN");
  assert.equal(authenticatedAdmin.email, ADMIN_EMAIL);

  // Unregistered public user cannot log in directly
  await assert.rejects(
    () =>
      dispatchLocalApiRequest(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: "mohammad@test.ir",
            password: "Password123!",
          }),
        },
        storage
      ),
    (err: unknown) => err instanceof LocalApiError && err.status === 401
  );

  // Public registration cannot claim the dedicated admin email
  await assert.rejects(
    () =>
      dispatchLocalApiRequest(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: "جعلی",
            email: ADMIN_EMAIL,
            password: "Password123!",
          }),
        },
        storage
      ),
    (err: unknown) => err instanceof LocalApiError && err.status === 403
  );

  // Register a fresh student
  const regRes = await dispatchLocalApiRequest<{
    user: PublicUser;
    token: string;
  }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name: "محمد حسینی",
        email: "mohammad@test.ir",
        password: "Password123!",
        phone: "09120001122",
      }),
    },
    storage
  );
  assert.equal(regRes.user.role, "STUDENT");
  assert.equal(regRes.user.email, "mohammad@test.ir");

  // Logout then sign back in with registered credentials
  await dispatchLocalApiRequest("/api/auth/logout", { method: "POST" }, storage);
  assert.equal(storage.getItem(AUTH_TOKEN_KEY), null);

  const studentRes = await dispatchLocalApiRequest<{
    user: PublicUser;
    enrolledCourseIds: string[];
    token: string;
  }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: "mohammad@test.ir",
        password: "Password123!",
      }),
    },
    storage
  );
  assert.equal(studentRes.user.role, "STUDENT");
  assert.equal(studentRes.user.email, "mohammad@test.ir");
  assert.ok(storage.getItem(AUTH_TOKEN_KEY));

  // Reject student from admin overview
  await assert.rejects(
    () => dispatchLocalApiRequest("/api/admin/overview", {}, storage),
    (err: unknown) => err instanceof LocalApiError && err.status === 403
  );

  // Re-bootstrap reads the persisted session
  const me = await dispatchLocalApiRequest<{ user: PublicUser | null }>(
    "/api/auth/me",
    {},
    storage
  );
  assert.equal(me.user?.email, "mohammad@test.ir");
});

test("admin course create, edit, duplicate, and delete immediately reflect in catalog", async () => {
  const storage = createMemoryStorage();

  // Wrong admin password rejected
  await assert.rejects(
    () =>
      dispatchLocalApiRequest(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: ADMIN_EMAIL,
            password: "wrong-password",
          }),
        },
        storage
      ),
    (err: unknown) => err instanceof LocalApiError && err.status === 401
  );

  const adminLogin = await dispatchLocalApiRequest<{ user: PublicUser }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: "mmnn8787",
      }),
    },
    storage
  );
  assert.equal(adminLogin.user.role, "ADMIN");
  assert.equal(adminLogin.user.email, ADMIN_EMAIL);

  // Create
  const created = await dispatchLocalApiRequest<{ course: CourseSummary }>(
    "/api/admin/courses",
    {
      method: "POST",
      body: JSON.stringify({
        title: "دوره تخصصی Rust و WebAssembly",
        shortDesc: "آموزش زبان Rust از صفر تا ساخت سرویس‌های فوق‌سریع",
        description: "توضیحات کامل دوره راست",
        categoryId: "cat_backend",
        price: 3200000,
        discountPrice: 2400000,
        level: "INTERMEDIATE",
        isPublished: true,
        isFeatured: true,
      }),
    },
    storage
  );
  assert.equal(created.course.title, "دوره تخصصی Rust و WebAssembly");

  // Appears in public catalog immediately (newest first)
  const catalogAfterCreate = await dispatchLocalApiRequest<{
    courses: CourseSummary[];
  }>("/api/courses?sort=newest", {}, storage);
  assert.equal(catalogAfterCreate.courses.length, 7);
  assert.equal(catalogAfterCreate.courses[0].id, created.course.id);

  // Edit
  await dispatchLocalApiRequest(
    `/api/admin/courses/${created.course.id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title: "دوره پیشرفته Rust و سیستم‌های پرسرعت",
        price: 3500000,
      }),
    },
    storage
  );

  const catalogAfterEdit = await dispatchLocalApiRequest<{
    courses: CourseSummary[];
  }>("/api/courses?sort=newest", {}, storage);
  assert.equal(
    catalogAfterEdit.courses[0].title,
    "دوره پیشرفته Rust و سیستم‌های پرسرعت"
  );

  // Duplicate (creates unpublished copy)
  const dup = await dispatchLocalApiRequest<{ course: CourseSummary }>(
    `/api/admin/courses/${created.course.id}/duplicate`,
    { method: "POST" },
    storage
  );
  assert.equal(dup.course.isPublished, false);

  const adminCatalog = await dispatchLocalApiRequest<{
    courses: CourseSummary[];
  }>("/api/courses?includeUnpublished=true", {}, storage);
  assert.equal(adminCatalog.courses.length, 8);

  // Delete both
  await dispatchLocalApiRequest(
    `/api/admin/courses/${created.course.id}`,
    { method: "DELETE" },
    storage
  );
  await dispatchLocalApiRequest(
    `/api/admin/courses/${dup.course.id}`,
    { method: "DELETE" },
    storage
  );

  const finalCatalog = await dispatchLocalApiRequest<{
    courses: CourseSummary[];
  }>("/api/courses", {}, storage);
  assert.equal(finalCatalog.courses.length, 6);
});

test("coupon validation and checkout flow unlocks course for registered student", async () => {
  const storage = createMemoryStorage();

  await dispatchLocalApiRequest(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name: "سارا کریمی",
        email: "sara@test.ir",
        password: "Password123!",
      }),
    },
    storage
  );

  const couponRes = await dispatchLocalApiRequest<{
    coupon: { code: string; type: string; value: number };
  }>(
    "/api/coupons/validate",
    {
      method: "POST",
      body: JSON.stringify({ code: "bahar30" }),
    },
    storage
  );
  assert.equal(couponRes.coupon.code, "BAHAR30");
  assert.equal(couponRes.coupon.value, 30);

  const init = await dispatchLocalApiRequest<{
    orderId: string;
    orderNumber: string;
    finalAmount: number;
  }>(
    "/api/checkout/initiate",
    {
      method: "POST",
      body: JSON.stringify({
        courseIds: ["crs_ai_llm"],
        couponCode: "BAHAR30",
      }),
    },
    storage
  );
  assert.equal(init.finalAmount, 2940000); // 4,200,000 * 0.7

  const verified = await dispatchLocalApiRequest<{
    success: boolean;
    enrolledCourseIds: string[];
  }>(
    "/api/checkout/verify",
    {
      method: "POST",
      body: JSON.stringify({
        orderId: init.orderId,
        status: "SUCCESS",
      }),
    },
    storage
  );
  assert.equal(verified.success, true);
  assert.ok(verified.enrolledCourseIds.includes("crs_ai_llm"));

  const dashboard = await dispatchLocalApiRequest<{
    enrolledCourses: CourseSummary[];
    orders: Array<{ orderNumber: string; status: string }>;
  }>("/api/student/dashboard", {}, storage);

  assert.equal(dashboard.enrolledCourses.length, 1);
  assert.equal(dashboard.orders.length, 1);
  assert.equal(dashboard.orders[0].status, "COMPLETED");
});

test("admin can update, persist, and reset platform settings and feature toggles", async () => {
  const storage = createMemoryStorage();

  // Reject unauthenticated settings update
  await assert.rejects(
    () =>
      dispatchLocalApiRequest(
        "/api/admin/settings",
        {
          method: "PUT",
          body: JSON.stringify({ themePalette: "emerald_obsidian" }),
        },
        storage
      ),
    (err: unknown) => err instanceof LocalApiError && err.status === 401
  );

  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: "mmnn8787",
      }),
    },
    storage
  );

  const updated = await dispatchLocalApiRequest<{
    settings: {
      themePalette: string;
      fontFamily: string;
      baseFontSize: number;
      allowRegistration: boolean;
      allowCoupons: boolean;
      heroTitle: string;
    };
  }>(
    "/api/admin/settings",
    {
      method: "PUT",
      body: JSON.stringify({
        themePalette: "rose_midnight",
        fontFamily: "rubik",
        baseFontSize: 18,
        allowRegistration: false,
        allowCoupons: false,
        heroTitle: "آکادمی تخصصی مهندسی نرم‌افزار",
      }),
    },
    storage
  );

  assert.equal(updated.settings.themePalette, "rose_midnight");
  assert.equal(updated.settings.fontFamily, "rubik");
  assert.equal(updated.settings.baseFontSize, 18);
  assert.equal(updated.settings.allowRegistration, false);

  // Bootstrap serves persisted settings
  const boot = await dispatchLocalApiRequest<{
    settings: { themePalette: string; fontFamily: string; heroTitle: string };
  }>("/api/bootstrap", {}, storage);
  assert.equal(boot.settings.themePalette, "rose_midnight");
  assert.equal(boot.settings.fontFamily, "rubik");
  assert.equal(boot.settings.heroTitle, "آکادمی تخصصی مهندسی نرم‌افزار");

  // Feature toggles are enforced in backend handlers
  await assert.rejects(
    () =>
      dispatchLocalApiRequest(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: "کاربر تست",
            email: "blocked@test.ir",
            password: "Password123!",
          }),
        },
        storage
      ),
    (err: unknown) => err instanceof LocalApiError && err.status === 403
  );

  await assert.rejects(
    () =>
      dispatchLocalApiRequest(
        "/api/coupons/validate",
        {
          method: "POST",
          body: JSON.stringify({ code: "BAHAR30" }),
        },
        storage
      ),
    (err: unknown) => err instanceof LocalApiError && err.status === 400
  );

  // Reset restores defaults
  const reset = await dispatchLocalApiRequest<{
    settings: {
      themePalette: string;
      fontFamily: string;
      baseFontSize: number;
      allowRegistration: boolean;
    };
  }>("/api/admin/settings/reset", { method: "POST" }, storage);
  assert.equal(reset.settings.themePalette, "indigo_slate");
  assert.equal(reset.settings.fontFamily, "vazirmatn");
  assert.equal(reset.settings.baseFontSize, 16);
  assert.equal(reset.settings.allowRegistration, true);
});

