import test from "node:test";
import assert from "node:assert/strict";
import {
  isPasswordRecoveryUrl,
  mapSupabaseAuthUserToPublicUser,
  translateSupabaseAuthError,
  validateAuthEmail,
  validateAuthPassword,
} from "./supabaseAuth";
import {
  ADMIN_EMAIL,
  createMemoryStorage,
  dispatchLocalApiRequest,
  syncSupabaseAuthSessionToLocalStore,
} from "./localBackend";

test("validateAuthEmail validates and normalizes emails properly", () => {
  const ok = validateAuthEmail("  Student.Test@Gmail.com ");
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, "student.test@gmail.com");

  const empty = validateAuthEmail("   ");
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const invalid = validateAuthEmail("not-an-email");
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);
});

test("validateAuthPassword enforces minimum 6 characters with Persian message", () => {
  assert.equal(validateAuthPassword("12345").valid, false);
  assert.equal(
    validateAuthPassword("12345").error,
    "رمز عبور باید حداقل ۶ کاراکتر باشد."
  );
  assert.equal(validateAuthPassword("123456").valid, true);
});

test("translateSupabaseAuthError returns exact Persian messages for core auth errors", () => {
  assert.equal(
    translateSupabaseAuthError(
      { message: "Invalid login credentials", code: "invalid_credentials" },
      "login"
    ),
    "ایمیل یا رمز عبور اشتباه است"
  );

  assert.match(
    translateSupabaseAuthError(
      { message: "User already registered", code: "user_already_exists" },
      "signup"
    ),
    /قبلاً ثبت‌نام شده/
  );

  assert.equal(
    translateSupabaseAuthError(
      { message: "Password should be at least 6 characters", code: "weak_password" },
      "signup"
    ),
    "رمز عبور باید حداقل ۶ کاراکتر باشد."
  );

  assert.match(
    translateSupabaseAuthError({ status: 429, message: "rate limit" }, "recovery"),
    /بیش از حد مجاز/
  );

  assert.match(
    translateSupabaseAuthError(
      { message: "Auth session missing!" },
      "updatePassword"
    ),
    /منقضی شده/
  );
});

test("isPasswordRecoveryUrl detects recovery hash and query params accurately", () => {
  assert.equal(
    isPasswordRecoveryUrl("#access_token=abc&expires_in=3600&type=recovery", ""),
    true
  );
  assert.equal(isPasswordRecoveryUrl("", "?type=recovery&code=xyz"), true);
  assert.equal(isPasswordRecoveryUrl("#access_token=abc&type=signup", ""), false);
  assert.equal(isPasswordRecoveryUrl("", ""), false);
});

test("mapSupabaseAuthUserToPublicUser maps full_name, fallback name, and ADMIN email role", () => {
  const student = mapSupabaseAuthUserToPublicUser({
    id: "uuid-student-1",
    email: "ali.dev@gmail.com",
    user_metadata: { full_name: "علی رضایی", phone: "09123456789" },
    app_metadata: {},
    created_at: "2026-11-20T00:00:00.000Z",
    email_confirmed_at: "2026-11-20T00:00:00.000Z",
  });
  assert.equal(student.id, "uuid-student-1");
  assert.equal(student.name, "علی رضایی");
  assert.equal(student.email, "ali.dev@gmail.com");
  assert.equal(student.role, "STUDENT");
  assert.equal(student.phone, "09123456789");

  const admin = mapSupabaseAuthUserToPublicUser({
    id: "uuid-admin-1",
    email: ADMIN_EMAIL,
    user_metadata: { full_name: "مهرشاد روحی" },
    app_metadata: {},
    created_at: "2026-11-20T00:00:00.000Z",
  });
  assert.equal(admin.role, "ADMIN");
  assert.equal(admin.email, ADMIN_EMAIL);

  const fallbackName = mapSupabaseAuthUserToPublicUser({
    id: "uuid-noname",
    email: "coder99@gmail.com",
    user_metadata: {},
    app_metadata: {},
    created_at: "2026-11-20T00:00:00.000Z",
  });
  assert.equal(fallbackName.name, "coder99");
});

test("syncSupabaseAuthSessionToLocalStore bridges real Supabase Auth user into dashboard and admin APIs cleanly", async () => {
  const storage = createMemoryStorage();
  const adminPublic = mapSupabaseAuthUserToPublicUser({
    id: "sb-uuid-admin",
    email: ADMIN_EMAIL,
    user_metadata: { full_name: "مهرشاد روحی" },
    app_metadata: {},
    created_at: "2026-11-20T00:00:00.000Z",
  });

  syncSupabaseAuthSessionToLocalStore(adminPublic, [], storage);

  const overview = await dispatchLocalApiRequest<{ stats: { totalCourses: number } }>(
    "/api/admin/overview",
    {},
    storage
  );
  assert.ok(overview.stats.totalCourses > 0);

  syncSupabaseAuthSessionToLocalStore(null, [], storage);
  await assert.rejects(
    () => dispatchLocalApiRequest("/api/admin/overview", {}, storage),
    /وارد حساب کاربری/
  );
});

test("createSafeAuthStorage persists sessions across localStorage, falls back to sessionStorage, and falls back to memory when iframe storage throws", async () => {
  const { createSafeAuthStorage } = await import("./supabase");

  const throwingStorage = {
    getItem() {
      throw new Error("SecurityError: blocked in sandboxed iframe");
    },
    setItem() {
      throw new Error("SecurityError: blocked in sandboxed iframe");
    },
    removeItem() {
      throw new Error("SecurityError: blocked in sandboxed iframe");
    },
  };

  // Fallback to secondary storage (e.g. sessionStorage) when primary throws
  const backingMap = new Map<string, string>();
  const secondaryStorage = {
    getItem: (k: string) => backingMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backingMap.set(k, v);
    },
    removeItem: (k: string) => {
      backingMap.delete(k);
    },
  };

  const hybrid = createSafeAuthStorage([throwingStorage, secondaryStorage]);
  hybrid.setItem("sb-session", JSON.stringify({ access_token: "tok-123" }));
  assert.equal(
    hybrid.getItem("sb-session"),
    JSON.stringify({ access_token: "tok-123" })
  );
  assert.equal(
    backingMap.get("sb-session"),
    JSON.stringify({ access_token: "tok-123" })
  );
  hybrid.removeItem("sb-session");
  assert.equal(hybrid.getItem("sb-session"), null);

  // Pure in-memory fallback when ALL browser storages throw
  const memOnly = createSafeAuthStorage([throwingStorage, throwingStorage]);
  memOnly.setItem("sb-session", "mem-token");
  assert.equal(memOnly.getItem("sb-session"), "mem-token");
  memOnly.removeItem("sb-session");
  assert.equal(memOnly.getItem("sb-session"), null);
});

test("ADMIN email always retains ADMIN role even if extra metadata specifies STUDENT", () => {
  const admin = mapSupabaseAuthUserToPublicUser(
    {
      id: "uuid-admin-persist",
      email: "  MehrshadRuhi87@gmail.com  ",
      user_metadata: { full_name: "مهرشاد روحی", role: "STUDENT" },
      app_metadata: { role: "STUDENT" },
      created_at: "2026-11-20T00:00:00.000Z",
    },
    { role: "STUDENT" }
  );
  assert.equal(admin.email, "mehrshadruhi87@gmail.com");
  assert.equal(admin.role, "ADMIN");
});

