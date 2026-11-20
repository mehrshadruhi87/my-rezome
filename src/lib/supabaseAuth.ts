import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { InstructorStatus, PublicUser, UserRole } from "../types";
import { ADMIN_EMAIL } from "./localBackend";
import { normalizeRole } from "./supabaseStore";

export type AuthErrorContext =
  | "login"
  | "signup"
  | "recovery"
  | "updatePassword";

export interface SupabaseAuthErrorLike {
  message?: string;
  status?: number;
  code?: string;
}

export function validateAuthEmail(rawEmail: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = String(rawEmail ?? "").trim().toLowerCase();
  if (!normalized) {
    return {
      valid: false,
      normalized,
      error: "لطفاً آدرس ایمیل خود را وارد کنید.",
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "فرمت آدرس ایمیل معتبر نیست.",
    };
  }
  return { valid: true, normalized };
}

export function validateAuthPassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!password || password.length < 6) {
    return {
      valid: false,
      error: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
    };
  }
  return { valid: true };
}

export function translateSupabaseAuthError(
  error: SupabaseAuthErrorLike | null | undefined,
  context: AuthErrorContext = "login"
): string {
  const rawMessage = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();
  const status = error?.status ?? 0;

  if (
    code === "invalid_credentials" ||
    rawMessage.includes("invalid login credentials") ||
    rawMessage.includes("invalid email or password")
  ) {
    return "ایمیل یا رمز عبور اشتباه است";
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    rawMessage.includes("user already registered") ||
    rawMessage.includes("already been registered") ||
    rawMessage.includes("already registered")
  ) {
    return "این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد حساب کاربری خود شوید.";
  }

  if (
    code === "weak_password" ||
    rawMessage.includes("password should be at least") ||
    rawMessage.includes("at least 6 characters")
  ) {
    return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  }

  if (
    code === "same_password" ||
    rawMessage.includes("new password should be different")
  ) {
    return "رمز عبور جدید باید با رمز عبور قبلی متفاوت باشد.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429 ||
    rawMessage.includes("rate limit") ||
    rawMessage.includes("too many requests") ||
    rawMessage.includes("for security purposes, you can only request this")
  ) {
    return "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.";
  }

  if (
    code === "email_not_confirmed" ||
    rawMessage.includes("email not confirmed")
  ) {
    return "ایمیل شما هنوز تایید نشده است. لطفاً صندوق ورودی یا پوشه Spam خود را بررسی کنید.";
  }

  if (
    code === "validation_failed" ||
    rawMessage.includes("unable to validate email") ||
    rawMessage.includes("invalid email") ||
    rawMessage.includes("invalid format")
  ) {
    return "فرمت آدرس ایمیل معتبر نیست.";
  }

  if (
    code === "session_not_found" ||
    rawMessage.includes("auth session missing") ||
    rawMessage.includes("session expired") ||
    rawMessage.includes("expired")
  ) {
    return "لینک بازیابی رمز عبور منقضی شده یا نامعتبر است. لطفاً دوباره درخواست بازیابی دهید.";
  }

  if (
    rawMessage.includes("failed to fetch") ||
    rawMessage.includes("network")
  ) {
    return "اتصال به سرور احراز هویت برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.";
  }

  if (context === "login") {
    return "ایمیل یا رمز عبور اشتباه است";
  }
  if (context === "signup") {
    return "ثبت‌نام با خطا مواجه شد. لطفاً اطلاعات واردشده را بررسی کرده و دوباره تلاش کنید.";
  }
  if (context === "recovery") {
    return "ارسال لینک بازیابی رمز عبور با خطا مواجه شد. لطفاً آدرس ایمیل را بررسی کنید.";
  }
  return "تغییر رمز عبور با خطا مواجه شد. لطفاً دوباره تلاش کنید.";
}

export function isPasswordRecoveryUrl(hash: string, search = ""): boolean {
  const cleanHash = String(hash ?? "").replace(/^#/, "");
  const cleanSearch = String(search ?? "").replace(/^\?/, "");
  const hashParams = new URLSearchParams(cleanHash);
  const searchParams = new URLSearchParams(cleanSearch);
  return (
    hashParams.get("type") === "recovery" ||
    searchParams.get("type") === "recovery"
  );
}

export function mapSupabaseAuthUserToPublicUser(
  authUser: Pick<
    SupabaseAuthUser,
    "id" | "email" | "user_metadata" | "app_metadata" | "created_at" | "email_confirmed_at"
  >,
  extra?: {
    role?: UserRole;
    phone?: string | null;
    bio?: string | null;
    instructorStatus?: InstructorStatus | null;
  }
): PublicUser {
  const email = String(authUser.email ?? "").trim().toLowerCase();
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const appMeta = (authUser.app_metadata ?? {}) as Record<string, unknown>;

  const rawName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (email ? email.split("@")[0] : "کاربر");

  const resolvedRole: UserRole =
    email === ADMIN_EMAIL
      ? "ADMIN"
      : extra?.role
      ? normalizeRole(extra.role)
      : appMeta.role
      ? normalizeRole(appMeta.role)
      : meta.role
      ? normalizeRole(meta.role)
      : "STUDENT";

  const rawInstructorStatus =
    extra?.instructorStatus ??
    (typeof meta.instructor_status === "string"
      ? (meta.instructor_status as InstructorStatus)
      : null);

  const phone =
    extra?.phone !== undefined
      ? extra.phone
      : typeof meta.phone === "string" && meta.phone.trim()
      ? meta.phone.trim()
      : null;

  const bio =
    extra?.bio !== undefined
      ? extra.bio
      : typeof meta.bio === "string" && meta.bio.trim()
      ? meta.bio.trim()
      : null;

  return {
    id: String(authUser.id),
    name: rawName,
    email,
    username:
      typeof meta.username === "string" && meta.username.trim()
        ? meta.username.trim()
        : null,
    role: resolvedRole,
    phone,
    bio,
    isActive: true,
    isEmailVerified: Boolean(authUser.email_confirmed_at) || true,
    instructorStatus: rawInstructorStatus,
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}
