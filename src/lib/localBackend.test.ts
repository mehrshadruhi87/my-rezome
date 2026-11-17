import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_TOKEN_KEY,
  LocalApiError,
  createMemoryStorage,
  dispatchLocalApiRequest,
} from "./localBackend";
import type { CategoryItem, CourseSummary, PublicUser } from "../types";

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

test("supports demo student login, demo admin login, registration, and logout", async () => {
  const storage = createMemoryStorage();

  const studentRes = await dispatchLocalApiRequest<{
    user: PublicUser;
    enrolledCourseIds: string[];
    token: string;
  }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: "student@academy.ir",
        password: "Student1234!",
      }),
    },
    storage
  );
  assert.equal(studentRes.user.role, "STUDENT");
  assert.ok(studentRes.enrolledCourseIds.includes("crs_nextjs_15"));
  assert.ok(storage.getItem(AUTH_TOKEN_KEY));

  // Reject student from admin overview
  await assert.rejects(
    () =>
      dispatchLocalApiRequest("/api/admin/overview", {}, storage),
    (err: unknown) => err instanceof LocalApiError && err.status === 403
  );

  await dispatchLocalApiRequest("/api/auth/logout", { method: "POST" }, storage);
  assert.equal(storage.getItem(AUTH_TOKEN_KEY), null);

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

  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: "admin@academy.ir",
        password: "Admin1234!",
      }),
    },
    storage
  );

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

test("coupon validation and checkout flow unlocks course for student", async () => {
  const storage = createMemoryStorage();

  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: "student@academy.ir",
        password: "Student1234!",
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

  assert.equal(dashboard.enrolledCourses.length, 2);
  assert.equal(dashboard.orders.length, 2);
  assert.equal(dashboard.orders[0].status, "COMPLETED");
});
