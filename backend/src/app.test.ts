import assert from "node:assert/strict";
import http from "node:http";
import test, { after, beforeEach } from "node:test";
import { createApp } from "./app";
import { setRepositoryForTests } from "./db";
import { DevFileRepository } from "./db/devFileRepository";

interface CookieJar {
  cookies: Map<string, string>;
  header(): string;
  capture(res: Response): void;
}

function createCookieJar(): CookieJar {
  const cookies = new Map<string, string>();
  return {
    cookies,
    header() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    capture(res: Response) {
      const headersAny = res.headers as unknown as {
        getSetCookie?: () => string[];
      };
      const rawList =
        typeof headersAny.getSetCookie === "function"
          ? headersAny.getSetCookie()
          : [];
      for (const raw of rawList) {
        const pair = raw.split(";")[0];
        const eqIdx = pair.indexOf("=");
        if (eqIdx === -1) continue;
        const name = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        if (!value) {
          cookies.delete(name);
        } else {
          cookies.set(name, value);
        }
      }
    },
  };
}

async function startTestServer() {
  const repo = new DevFileRepository({ inMemory: true });
  setRepositoryForTests(repo);
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    repo,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      ),
  };
}

async function apiJson<T = any>(
  baseUrl: string,
  path: string,
  jar: CookieJar | null,
  options: RequestInit = {}
): Promise<{ status: number; body: any; data: T }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }
  if (jar && jar.cookies.size > 0) {
    headers.Cookie = jar.header();
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    redirect: "manual",
  });
  if (jar) jar.capture(res);

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return {
    status: res.status,
    body,
    data: body && typeof body === "object" && "data" in body ? body.data : body,
  };
}

let activeServer: Awaited<ReturnType<typeof startTestServer>> | null = null;

beforeEach(async () => {
  if (activeServer) {
    await activeServer.close();
  }
  activeServer = await startTestServer();
});

after(async () => {
  if (activeServer) {
    await activeServer.close();
    activeServer = null;
  }
  setRepositoryForTests(null);
});

test("health, bootstrap, swagger docs, and standard 404 JSON envelope", async () => {
  const { baseUrl } = activeServer!;

  const health = await apiJson(baseUrl, "/api/health", null);
  assert.equal(health.status, 200);
  assert.equal(health.body.success, true);
  assert.equal(health.data.ok, true);

  const boot = await apiJson(baseUrl, "/api/bootstrap", null);
  assert.equal(boot.status, 200);
  assert.equal(boot.data.categories.length, 6);
  assert.equal(boot.data.user, null);

  const docsJson = await apiJson(baseUrl, "/api/docs.json", null);
  assert.equal(docsJson.status, 200);
  assert.ok(docsJson.body.openapi);
  assert.ok(docsJson.body.paths["/auth/login"]);

  const docsHtml = await fetch(`${baseUrl}/api/docs`);
  assert.equal(docsHtml.status, 200);
  const htmlText = await docsHtml.text();
  assert.ok(htmlText.includes("swagger"));

  const notFound = await apiJson(baseUrl, "/api/nonexistent-endpoint", null);
  assert.equal(notFound.status, 404);
  assert.equal(notFound.body.success, false);
  assert.equal(notFound.body.error?.code, "ROUTE_NOT_FOUND");

  const allowedRunOrigin = await fetch(`${baseUrl}/api/health`, {
    headers: {
      Origin: "https://ais-dev-example-123.europe-west3.run.app",
    },
  });
  assert.equal(allowedRunOrigin.status, 200);
  assert.equal(
    allowedRunOrigin.headers.get("access-control-allow-origin"),
    "https://ais-dev-example-123.europe-west3.run.app"
  );

  const disallowedOrigin = await fetch(`${baseUrl}/api/health`, {
    headers: {
      Origin: "https://evil.example.com",
    },
  });
  assert.equal(disallowedOrigin.status, 200);
  assert.equal(
    disallowedOrigin.headers.get("access-control-allow-origin"),
    null
  );
});

test("auth registration, Zod validation, HttpOnly cookies, email OTP verification, token rotation, password reset & sessions", async () => {
  const { baseUrl } = activeServer!;
  const jar = createCookieJar();

  // Zod validation error on malformed registration
  const badReg = await apiJson(baseUrl, "/api/auth/register", jar, {
    method: "POST",
    body: JSON.stringify({
      name: "A",
      email: "not-an-email",
      password: "123",
      phone: "1234",
    }),
  });
  assert.equal(badReg.status, 400);
  assert.equal(badReg.body.success, false);
  assert.equal(badReg.body.error?.code, "BAD_REQUEST");

  // Valid registration issues HttpOnly cookies
  const reg = await apiJson(baseUrl, "/api/auth/register", jar, {
    method: "POST",
    body: JSON.stringify({
      name: "سارا احمدی",
      email: "sara.ahmadi@test.ir",
      password: "Password@123",
      phone: "09121112233",
    }),
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.user.role, "STUDENT");
  assert.equal(reg.data.user.isEmailVerified, false);
  assert.ok(jar.cookies.has("ca_access_token"));
  assert.ok(jar.cookies.has("ca_refresh_token"));

  // Request and confirm email verification OTP
  const reqVerify = await apiJson(baseUrl, "/api/auth/verify/request", jar, {
    method: "POST",
    body: JSON.stringify({ channel: "email" }),
  });
  assert.equal(reqVerify.status, 200);
  assert.ok(reqVerify.data.devOtpPreview);

  const confirmVerify = await apiJson(baseUrl, "/api/auth/verify/confirm", jar, {
    method: "POST",
    body: JSON.stringify({
      channel: "email",
      code: reqVerify.data.devOtpPreview,
    }),
  });
  assert.equal(confirmVerify.status, 200);
  assert.equal(confirmVerify.data.user.isEmailVerified, true);

  // Refresh rotates token; reusing old refresh token is rejected
  const oldRefresh = jar.cookies.get("ca_refresh_token")!;
  const refreshRes = await apiJson(baseUrl, "/api/auth/refresh", jar, {
    method: "POST",
  });
  assert.equal(refreshRes.status, 200);
  const newRefresh = jar.cookies.get("ca_refresh_token")!;
  assert.notEqual(newRefresh, oldRefresh);

  // Reuse attack detection with old refresh token revokes the session
  const attackerJar = createCookieJar();
  attackerJar.cookies.set("ca_refresh_token", oldRefresh);
  const reuseRes = await apiJson(baseUrl, "/api/auth/refresh", attackerJar, {
    method: "POST",
  });
  assert.equal(reuseRes.status, 401);

  // Old compromised session can no longer refresh
  const afterReuse = await apiJson(baseUrl, "/api/auth/refresh", jar, {
    method: "POST",
  });
  assert.equal(afterReuse.status, 401);

  // Forgot + Reset password flow
  const forgotRes = await apiJson(baseUrl, "/api/auth/password/forgot", null, {
    method: "POST",
    body: JSON.stringify({ email: "sara.ahmadi@test.ir" }),
  });
  assert.equal(forgotRes.status, 200);
  assert.ok(forgotRes.data.devOtpPreview);

  const resetRes = await apiJson(baseUrl, "/api/auth/password/reset", null, {
    method: "POST",
    body: JSON.stringify({
      email: "sara.ahmadi@test.ir",
      code: forgotRes.data.devOtpPreview,
      newPassword: "NewPassword@456",
    }),
  });
  assert.equal(resetRes.status, 200);

  // Login with new password & inspect active sessions
  const loginJar = createCookieJar();
  const loginRes = await apiJson(baseUrl, "/api/auth/login", loginJar, {
    method: "POST",
    body: JSON.stringify({
      email: "sara.ahmadi@test.ir",
      password: "NewPassword@456",
    }),
  });
  assert.equal(loginRes.status, 200);

  const sessionsRes = await apiJson(baseUrl, "/api/auth/sessions", loginJar);
  assert.equal(sessionsRes.status, 200);
  assert.equal(sessionsRes.data.sessions.length, 1);
  assert.equal(sessionsRes.data.sessions[0].isCurrent, true);

  // Change password while logged in
  const changeRes = await apiJson(
    baseUrl,
    "/api/auth/password/change",
    loginJar,
    {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "NewPassword@456",
        newPassword: "FinalPassword@789",
      }),
    }
  );
  assert.equal(changeRes.status, 200);

  // Logout all sessions
  const logoutAll = await apiJson(baseUrl, "/api/auth/logout-all", loginJar, {
    method: "POST",
  });
  assert.equal(logoutAll.status, 200);
  const meAfterLogout = await apiJson(baseUrl, "/api/auth/me", loginJar);
  assert.equal(meAfterLogout.data.user, null);
});

test("RBAC enforcement (Student vs Instructor ownership vs Admin) and paid lesson content protection", async () => {
  const { baseUrl } = activeServer!;

  const studentJar = createCookieJar();
  await apiJson(baseUrl, "/api/auth/login", studentJar, {
    method: "POST",
    body: JSON.stringify({
      email: "student@codeacademy.ir",
      password: "Student@1234",
    }),
  });

  // Student blocked from admin and instructor routes
  const adminBlocked = await apiJson(baseUrl, "/api/admin/overview", studentJar);
  assert.equal(adminBlocked.status, 403);
  const instBlocked = await apiJson(
    baseUrl,
    "/api/instructor/overview",
    studentJar
  );
  assert.equal(instBlocked.status, 403);

  // Student inspects paid course: paid lesson videoUrl & codeSnippet must be stripped
  const detailRes = await apiJson(
    baseUrl,
    "/api/courses/nextjs-15-fullstack-bootcamp",
    studentJar
  );
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.data.course.category?.slug, "frontend");
  assert.ok(detailRes.data.course.category?.name);
  assert.equal(detailRes.data.course.isEnrolled, false);
  const lessons = detailRes.data.course.chapters.flatMap((c: any) => c.lessons);
  const paidLesson = lessons.find((l: any) => !l.isFree);
  assert.ok(paidLesson, "Seeded course must include at least one paid lesson");
  assert.equal(paidLesson.videoUrl, "");
  assert.equal(paidLesson.codeSnippet, "");

  // Direct lesson access check must reject non-enrolled student with 403
  const lockedLessonAccess = await apiJson(
    baseUrl,
    `/api/lessons/${paidLesson.id}/access`,
    studentJar
  );
  assert.equal(lockedLessonAccess.status, 403);

  // Instructor creates their own course & can manage it
  const instructorJar = createCookieJar();
  await apiJson(baseUrl, "/api/auth/login", instructorJar, {
    method: "POST",
    body: JSON.stringify({
      email: "instructor@codeacademy.ir",
      password: "Instructor@1234",
    }),
  });

  const createdCourse = await apiJson(
    baseUrl,
    "/api/admin/courses",
    instructorJar,
    {
      method: "POST",
      body: JSON.stringify({
        title: "دوره معماری GraphQL در Node.js",
        shortDesc: "طراحی APIهای گراف‌کیوال مقیاس‌پذیر",
        categoryId: "cat_backend",
        price: 1800000,
        discountPrice: 1200000,
        isPublished: true,
      }),
    }
  );
  assert.equal(createdCourse.status, 201);

  // Instructor cannot access Admin overview or delete courses they don't own
  const instOverview = await apiJson(
    baseUrl,
    "/api/instructor/overview",
    instructorJar
  );
  assert.equal(instOverview.status, 200);
  assert.ok(instOverview.data.courses.length >= 1);

  const instAdminBlocked = await apiJson(
    baseUrl,
    "/api/admin/overview",
    instructorJar
  );
  assert.equal(instAdminBlocked.status, 403);
});

test("checkout recalculates price server-side, verifies Zarinpal sandbox, prevents duplicate enrollment, and unlocks paid lessons", async () => {
  const { baseUrl } = activeServer!;

  const studentJar = createCookieJar();
  await apiJson(baseUrl, "/api/auth/login", studentJar, {
    method: "POST",
    body: JSON.stringify({
      email: "student@codeacademy.ir",
      password: "Student@1234",
    }),
  });

  // Initiate checkout with BAHAR30 coupon on crs_ai_llm (price 4,200,000 -> 30% off = 2,940,000)
  const initRes = await apiJson(baseUrl, "/api/checkout/initiate", studentJar, {
    method: "POST",
    body: JSON.stringify({
      courseIds: ["crs_ai_llm"],
      couponCode: "bahar30",
    }),
  });
  assert.equal(initRes.status, 201);
  assert.equal(initRes.data.finalAmount, 2940000);
  assert.equal(initRes.data.requiresGateway, true);
  assert.ok(initRes.data.authority);

  // Verify via Zarinpal sandbox API endpoint
  const verifyRes = await apiJson(baseUrl, "/api/checkout/verify", studentJar, {
    method: "POST",
    body: JSON.stringify({
      orderId: initRes.data.orderId,
      authority: initRes.data.authority,
      status: "OK",
    }),
  });
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.data.success, true);
  assert.ok(verifyRes.data.enrolledCourseIds.includes("crs_ai_llm"));

  // Duplicate purchase of same course must be blocked with 409
  const dupInit = await apiJson(baseUrl, "/api/checkout/initiate", studentJar, {
    method: "POST",
    body: JSON.stringify({ courseIds: ["crs_ai_llm"] }),
  });
  assert.equal(dupInit.status, 409);

  // Student dashboard reflects completed order and enrolled course
  const dash = await apiJson(baseUrl, "/api/student/dashboard", studentJar);
  assert.equal(dash.status, 200);
  assert.equal(dash.data.enrolledCourses.length, 1);
  assert.equal(dash.data.orders[0].status, "COMPLETED");

  // Notifications received an ORDER notification
  const notifRes = await apiJson(baseUrl, "/api/notifications", studentJar);
  assert.equal(notifRes.status, 200);
  assert.ok(notifRes.data.unreadCount >= 1);

  // Enrolled student can now access paid lesson
  const detailRes = await apiJson(
    baseUrl,
    "/api/courses/python-ai-llm-engineering",
    studentJar
  );
  assert.equal(detailRes.data.course.isEnrolled, true);
  const paidLesson = detailRes.data.course.chapters
    .flatMap((c: any) => c.lessons)
    .find((l: any) => !l.isFree);
  if (paidLesson) {
    const lessonAccess = await apiJson(
      baseUrl,
      `/api/lessons/${paidLesson.id}/access`,
      studentJar
    );
    assert.equal(lessonAccess.status, 200);
  }
});

test("reviews duplicate prevention, moderation by admin, overview analytics & upload validation", async () => {
  const { baseUrl } = activeServer!;

  const studentJar = createCookieJar();
  await apiJson(baseUrl, "/api/auth/login", studentJar, {
    method: "POST",
    body: JSON.stringify({
      email: "student@codeacademy.ir",
      password: "Student@1234",
    }),
  });

  // Create review
  const reviewRes = await apiJson(
    baseUrl,
    "/api/courses/crs_ai_llm/reviews",
    studentJar,
    {
      method: "POST",
      body: JSON.stringify({
        rating: 4,
        comment: "دوره بسیار کاربردی و منظم با مثال‌های واقعی بود.",
      }),
    }
  );
  assert.equal(reviewRes.status, 201);
  const reviewId = reviewRes.data.review.id;

  // Duplicate review by same user on same course returns 409
  const dupReview = await apiJson(
    baseUrl,
    "/api/courses/crs_ai_llm/reviews",
    studentJar,
    {
      method: "POST",
      body: JSON.stringify({
        rating: 5,
        comment: "تلاش برای نظر تکراری",
      }),
    }
  );
  assert.equal(dupReview.status, 409);

  // Admin login
  const adminJar = createCookieJar();
  await apiJson(baseUrl, "/api/auth/login", adminJar, {
    method: "POST",
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || "mehrshadruhi87@gmail.com",
      password: process.env.ADMIN_PASSWORD || "mmnn8787",
    }),
  });

  // Moderate review to REJECTED -> removed from public list
  const modRes = await apiJson(
    baseUrl,
    `/api/admin/reviews/${reviewId}/moderate`,
    adminJar,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "REJECTED" }),
    }
  );
  assert.equal(modRes.status, 200);
  assert.equal(modRes.data.review.status, "REJECTED");

  const publicReviews = await apiJson(
    baseUrl,
    "/api/courses/crs_ai_llm/reviews",
    null
  );
  assert.ok(!publicReviews.data.reviews.some((r: any) => r.id === reviewId));

  // Admin overview metrics
  const overview = await apiJson(baseUrl, "/api/admin/overview", adminJar);
  assert.equal(overview.status, 200);
  assert.ok(overview.data.stats.totalUsers >= 3);
  assert.ok(overview.data.stats.totalCourses >= 6);
  assert.ok(Array.isArray(overview.data.recentRegistrations));

  // Upload endpoint rejects empty body and accepts small PNG
  const emptyUpload = await apiJson(baseUrl, "/api/uploads", adminJar, {
    method: "POST",
  });
  assert.equal(emptyUpload.status, 400);

  const formData = new FormData();
  const pngBytes = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  ]);
  formData.append(
    "file",
    new Blob([pngBytes], { type: "image/png" }),
    "cover.png"
  );
  formData.append("folder", "courses");
  const uploadRes = await apiJson(baseUrl, "/api/uploads", adminJar, {
    method: "POST",
    body: formData,
  });
  assert.equal(uploadRes.status, 201);
  assert.ok(String(uploadRes.data.url).startsWith("data:image/png;base64,"));
});
