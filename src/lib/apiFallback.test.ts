import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  apiRequest,
  isOfflineFallbackActive,
  resetOfflineFallbackState,
} from "./api";
import { createMemoryStorage } from "./localBackend";

test("apiRequest defaults to direct localStorage mode with zero network calls when VITE_API_URL is unset", async () => {
  const storage = createMemoryStorage();
  resetOfflineFallbackState(storage);

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("fetch should not be called in static localStorage mode");
  }) as typeof fetch;

  try {
    assert.equal(isOfflineFallbackActive(), true);

    const boot = await apiRequest<{
      categories: unknown[];
      settings: { brandPrimaryText: string };
    }>("/api/bootstrap");
    assert.ok(boot.categories.length > 0);
    assert.equal(boot.settings.brandPrimaryText, "کد");

    const coursesRes = await apiRequest<{ courses: unknown[] }>("/api/courses");
    assert.ok(coursesRes.courses.length > 0);

    // Admin login + settings + overview + orders + reviews with zero network calls
    await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "mehrshadruhi87@gmail.com",
        password: "mmnn8787",
      }),
    });

    await apiRequest("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ brandPrimaryText: "سایبر" }),
    });

    const reloadedBoot = await apiRequest<{
      settings: { brandPrimaryText: string };
    }>("/api/bootstrap");
    assert.equal(reloadedBoot.settings.brandPrimaryText, "سایبر");

    const overviewRes = await apiRequest<{
      stats: {
        totalUsers: number;
        totalStudents: number;
        totalInstructors: number;
        totalOrdersCount: number;
        completedOrdersCount: number;
        totalRevenue: number;
        monthlyRevenue: number;
        pendingReviewsCount: number;
      };
      recentOrders: unknown[];
      recentRegistrations: unknown[];
    }>("/api/admin/overview");
    assert.equal(typeof overviewRes.stats.totalUsers, "number");
    assert.equal(typeof overviewRes.stats.monthlyRevenue, "number");
    assert.equal(typeof overviewRes.stats.totalOrdersCount, "number");
    assert.equal(typeof overviewRes.stats.totalInstructors, "number");
    assert.ok(Array.isArray(overviewRes.recentRegistrations));

    const ordersRes = await apiRequest<{ orders: unknown[] }>(
      "/api/admin/orders"
    );
    assert.ok(Array.isArray(ordersRes.orders));

    const reviewsRes = await apiRequest<{ reviews: unknown[] }>(
      "/api/admin/reviews"
    );
    assert.ok(Array.isArray(reviewsRes.reviews));

    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    resetOfflineFallbackState();
  }
});

test("remote mode seamlessly falls back to localStorage on network offline error", async () => {
  const storage = createMemoryStorage();
  resetOfflineFallbackState(storage, true);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new TypeError("Failed to fetch");
  }) as typeof fetch;

  try {
    const boot = await apiRequest<{
      categories: unknown[];
      settings: { brandPrimaryText: string };
    }>("/api/bootstrap");

    assert.equal(isOfflineFallbackActive(), true);
    assert.ok(boot.categories.length > 0);
    assert.equal(boot.settings.brandPrimaryText, "کد");
  } finally {
    globalThis.fetch = originalFetch;
    resetOfflineFallbackState();
  }
});

test("remote mode switches to localStorage when serverless backend reports memory-store", async () => {
  const storage = createMemoryStorage();
  resetOfflineFallbackState(storage, true);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-CodeAcademy-Storage": "memory-store",
      },
    })) as typeof fetch;

  try {
    const res = await apiRequest<{ courses: unknown[] }>("/api/courses");
    assert.equal(isOfflineFallbackActive(), true);
    assert.ok(res.courses.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
    resetOfflineFallbackState();
  }
});

test("remote mode preserves real 401/400 API errors when persistent backend is online", async () => {
  const storage = createMemoryStorage();
  resetOfflineFallbackState(storage, true);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: false,
        message: "رمز عبور اشتباه است.",
        error: { code: "INVALID_CREDENTIALS" },
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "X-CodeAcademy-Storage": "postgresql-prisma",
        },
      }
    )) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: "a@b.com", password: "wrong" }),
        }),
      (err: unknown) =>
        err instanceof ApiError &&
        err.status === 401 &&
        err.code === "INVALID_CREDENTIALS"
    );
    assert.equal(isOfflineFallbackActive(), false);
  } finally {
    globalThis.fetch = originalFetch;
    resetOfflineFallbackState();
  }
});
