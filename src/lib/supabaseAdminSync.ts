import { getSupabaseClient } from "./supabase";
import type {
  CategoryItem,
  ContentSubmissionItem,
  DiscountCodeItem,
  ModerationStatus,
  PlatformSettings,
} from "../types";

export const SUPABASE_ADMIN_SYNC_EVENT = "codeacademy:supabase-sync-status";

export interface SupabaseSyncStatus {
  missingTables: string[];
  lastError: string | null;
  lastSyncedAt: string | null;
}

const missingTablesSet = new Set<string>();
const missingTableCheckedAt = new Map<string, number>();
const MISSING_TABLE_READ_COOLDOWN_MS = 60_000;
let lastSyncError: string | null = null;
let lastSyncedAt: string | null = null;

function isTableInMissingCooldown(tableName: string): boolean {
  const checkedAt = missingTableCheckedAt.get(tableName);
  if (!checkedAt) return false;
  return Date.now() - checkedAt < MISSING_TABLE_READ_COOLDOWN_MS;
}

function emitSyncStatus(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<SupabaseSyncStatus>(SUPABASE_ADMIN_SYNC_EVENT, {
        detail: getSupabaseAdminSyncStatus(),
      })
    );
  } catch {
    // Ignore event dispatch failures
  }
}

export function isMissingTableError(error: {
  code?: string;
  message?: string;
} | null | undefined): boolean {
  if (!error) return false;
  const code = String(error.code ?? "");
  const msg = String(error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

export function recordSupabaseTableStatus(
  tableName: string,
  error: { code?: string; message?: string } | null | undefined
): void {
  if (!error) {
    missingTablesSet.delete(tableName);
    missingTableCheckedAt.delete(tableName);
    lastSyncedAt = new Date().toISOString();
    emitSyncStatus();
    return;
  }
  if (isMissingTableError(error)) {
    missingTablesSet.add(tableName);
    missingTableCheckedAt.set(tableName, Date.now());
  }
  lastSyncError = error.message || "Supabase sync error";
  emitSyncStatus();
}

export function getSupabaseAdminSyncStatus(): SupabaseSyncStatus {
  return {
    missingTables: Array.from(missingTablesSet),
    lastError: lastSyncError,
    lastSyncedAt,
  };
}

export function resetSupabaseAdminSyncStatusForTests(): void {
  missingTablesSet.clear();
  missingTableCheckedAt.clear();
  lastSyncError = null;
  lastSyncedAt = null;
}

export function normalizeModerationStatus(
  raw: unknown,
  fallback: ModerationStatus = "approved"
): ModerationStatus {
  const val = String(raw ?? "").toLowerCase().trim();
  if (val === "pending" || val === "approved" || val === "rejected") {
    return val;
  }
  return fallback;
}

export function isCoursePubliclyVisible(course: {
  isPublished?: boolean;
  moderationStatus?: ModerationStatus | string | null;
}): boolean {
  const status = normalizeModerationStatus(course.moderationStatus, "approved");
  return Boolean(course.isPublished) && status === "approved";
}

export interface SupabaseCourseRow {
  id: string;
  title: string;
  slug: string;
  short_desc: string;
  description: string;
  thumbnail: string;
  preview_video_url: string;
  price: number;
  discount_price: number | null;
  full_access: boolean;
  instructor_share_percent: number;
  instructor_discount_percent: number;
  instructor_id: string | null;
  instructor_name: string;
  instructor_title: string;
  instructor_bio: string;
  level: string;
  duration: string;
  prerequisites: string;
  language: string;
  students_count: number;
  rating: number;
  is_published: boolean;
  is_featured: boolean;
  status: ModerationStatus;
  rejection_reason: string | null;
  category_id: string;
  chapters: unknown;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
}

export interface SupabaseDiscountCodeRow {
  id: string;
  code: string;
  type: string;
  value: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SupabaseContentSubmissionRow {
  id: string;
  submission_type: string;
  course_id: string;
  course_title: string;
  instructor_id: string;
  instructor_name: string;
  instructor_email: string;
  summary: string;
  status: ModerationStatus;
  rejection_reason: string | null;
  payload: unknown;
  created_at: string;
  reviewed_at: string | null;
}

// --- COURSES ---
export async function fetchAllSupabaseCourses(): Promise<{
  ok: boolean;
  data: SupabaseCourseRow[];
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: [] };
  if (isTableInMissingCooldown("courses")) {
    return { ok: false, data: [], missingTable: true };
  }
  try {
    const { data, error } = await client
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      recordSupabaseTableStatus("courses", error);
      return { ok: false, data: [], missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("courses", null);
    return { ok: true, data: (data as SupabaseCourseRow[] | null) ?? [] };
  } catch {
    return { ok: false, data: [] };
  }
}

export async function upsertSupabaseCourse(
  row: SupabaseCourseRow
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client
      .from("courses")
      .upsert(row, { onConflict: "id" });
    if (error) {
      recordSupabaseTableStatus("courses", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("courses", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteSupabaseCourse(
  id: string
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("courses").delete().eq("id", id);
    if (error) {
      recordSupabaseTableStatus("courses", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("courses", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// --- CATEGORIES / DEPARTMENTS ---
export async function fetchAllSupabaseCategories(): Promise<{
  ok: boolean;
  data: CategoryItem[];
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: [] };
  if (isTableInMissingCooldown("categories")) {
    return { ok: false, data: [], missingTable: true };
  }
  try {
    const { data, error } = await client
      .from("categories")
      .select("id, name, slug, icon, description");
    if (error) {
      recordSupabaseTableStatus("categories", error);
      return { ok: false, data: [], missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("categories", null);
    const rows = ((data as SupabaseCategoryRow[] | null) ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      icon: String(r.icon || "Terminal"),
      description: r.description ?? null,
    }));
    return { ok: true, data: rows };
  } catch {
    return { ok: false, data: [] };
  }
}

export async function upsertSupabaseCategory(
  cat: CategoryItem
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("categories").upsert(
      {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
      },
      { onConflict: "id" }
    );
    if (error) {
      recordSupabaseTableStatus("categories", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("categories", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteSupabaseCategory(
  id: string
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("categories").delete().eq("id", id);
    if (error) {
      recordSupabaseTableStatus("categories", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("categories", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// --- DISCOUNT CODES / COUPONS ---
export async function fetchAllSupabaseDiscountCodes(): Promise<{
  ok: boolean;
  data: DiscountCodeItem[];
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: [] };
  if (isTableInMissingCooldown("discount_codes")) {
    return { ok: false, data: [], missingTable: true };
  }
  try {
    const { data, error } = await client
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      recordSupabaseTableStatus("discount_codes", error);
      return { ok: false, data: [], missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("discount_codes", null);
    const rows: DiscountCodeItem[] = (
      (data as SupabaseDiscountCodeRow[] | null) ?? []
    ).map((r) => ({
      id: String(r.id),
      code: String(r.code).toUpperCase(),
      type: r.type === "FIXED" ? "FIXED" : "PERCENTAGE",
      value: Number(r.value) || 0,
      maxUses: Number(r.max_uses) || 100,
      usedCount: Number(r.used_count) || 0,
      expiresAt: r.expires_at ?? null,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at || new Date().toISOString(),
    }));
    return { ok: true, data: rows };
  } catch {
    return { ok: false, data: [] };
  }
}

export async function upsertSupabaseDiscountCode(
  coupon: DiscountCodeItem
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("discount_codes").upsert(
      {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        max_uses: coupon.maxUses,
        used_count: coupon.usedCount,
        expires_at: coupon.expiresAt,
        is_active: coupon.isActive,
        created_at: coupon.createdAt,
      },
      { onConflict: "id" }
    );
    if (error) {
      recordSupabaseTableStatus("discount_codes", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("discount_codes", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteSupabaseDiscountCode(
  id: string
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("discount_codes").delete().eq("id", id);
    if (error) {
      recordSupabaseTableStatus("discount_codes", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("discount_codes", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// --- SITE SETTINGS ---
export async function fetchSupabaseSiteSettings(): Promise<{
  ok: boolean;
  data: Partial<PlatformSettings> | null;
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: null };
  if (isTableInMissingCooldown("site_settings")) {
    return { ok: false, data: null, missingTable: true };
  }
  try {
    const { data, error } = await client
      .from("site_settings")
      .select("id, settings")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      recordSupabaseTableStatus("site_settings", error);
      return { ok: false, data: null, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("site_settings", null);
    const settingsPayload = (
      data as { id?: number; settings?: Partial<PlatformSettings> } | null
    )?.settings;
    return { ok: true, data: settingsPayload ?? null };
  } catch {
    return { ok: false, data: null };
  }
}

export async function saveSupabaseSiteSettings(
  settings: PlatformSettings
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("site_settings").upsert(
      {
        id: 1,
        settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) {
      recordSupabaseTableStatus("site_settings", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("site_settings", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// --- INSTRUCTOR CONTENT MODERATION SUBMISSIONS ---
export async function fetchAllSupabaseSubmissions(): Promise<{
  ok: boolean;
  data: ContentSubmissionItem[];
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: [] };
  if (isTableInMissingCooldown("content_submissions")) {
    return { ok: false, data: [], missingTable: true };
  }
  try {
    const { data, error } = await client
      .from("content_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      recordSupabaseTableStatus("content_submissions", error);
      return { ok: false, data: [], missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("content_submissions", null);
    const rows: ContentSubmissionItem[] = (
      (data as SupabaseContentSubmissionRow[] | null) ?? []
    ).map((r) => ({
      id: String(r.id),
      type:
        r.submission_type === "course_edit" ||
        r.submission_type === "lesson_upload"
          ? r.submission_type
          : "course_create",
      courseId: String(r.course_id),
      courseTitle: String(r.course_title),
      instructorId: String(r.instructor_id),
      instructorName: String(r.instructor_name),
      instructorEmail: String(r.instructor_email),
      summary: String(r.summary || ""),
      status: normalizeModerationStatus(r.status, "pending"),
      rejectionReason: r.rejection_reason ?? null,
      payload:
        r.payload && typeof r.payload === "object"
          ? (r.payload as Record<string, unknown>)
          : undefined,
      createdAt: r.created_at || new Date().toISOString(),
      reviewedAt: r.reviewed_at ?? null,
    }));
    return { ok: true, data: rows };
  } catch {
    return { ok: false, data: [] };
  }
}

export async function upsertSupabaseSubmission(
  sub: ContentSubmissionItem
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };
  try {
    const { error } = await client.from("content_submissions").upsert(
      {
        id: sub.id,
        submission_type: sub.type,
        course_id: sub.courseId,
        course_title: sub.courseTitle,
        instructor_id: sub.instructorId,
        instructor_name: sub.instructorName,
        instructor_email: sub.instructorEmail,
        summary: sub.summary,
        status: sub.status,
        rejection_reason: sub.rejectionReason ?? null,
        payload: sub.payload ?? {},
        created_at: sub.createdAt,
        reviewed_at: sub.reviewedAt ?? null,
      },
      { onConflict: "id" }
    );
    if (error) {
      recordSupabaseTableStatus("content_submissions", error);
      return { ok: false, missingTable: isMissingTableError(error) };
    }
    recordSupabaseTableStatus("content_submissions", null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export const CODEACADEMY_FULL_SUPABASE_SQL = `-- CodeAcademy Super Admin & Instructor Moderation PostgreSQL Schema
-- Run once in Supabase SQL Editor (Project: mmimselnvkdbwjyziehj)

CREATE TABLE IF NOT EXISTS public.courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_desc text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  thumbnail text NOT NULL DEFAULT '',
  preview_video_url text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  discount_price numeric,
  full_access boolean NOT NULL DEFAULT false,
  instructor_share_percent integer NOT NULL DEFAULT 70,
  instructor_discount_percent integer NOT NULL DEFAULT 0,
  instructor_id text,
  instructor_name text NOT NULL DEFAULT '',
  instructor_title text NOT NULL DEFAULT '',
  instructor_bio text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'ALL_LEVELS',
  duration text NOT NULL DEFAULT '20h',
  prerequisites text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'فارسی',
  students_count integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 5.0,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  category_id text NOT NULL,
  chapters jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Terminal',
  description text
);

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id text PRIMARY KEY,
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'PERCENTAGE',
  value numeric NOT NULL DEFAULT 10,
  max_uses integer NOT NULL DEFAULT 100,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_submissions (
  id text PRIMARY KEY,
  submission_type text NOT NULL DEFAULT 'course_create',
  course_id text NOT NULL,
  course_title text NOT NULL,
  instructor_id text NOT NULL,
  instructor_name text NOT NULL,
  instructor_email text NOT NULL,
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id text PRIMARY KEY,
  course_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL DEFAULT 'دانشجو',
  author_role text NOT NULL DEFAULT 'STUDENT',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'APPROVED',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_paths (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT 'frontend',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id text PRIMARY KEY,
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'PERCENTAGE',
  value numeric NOT NULL DEFAULT 10,
  max_uses integer NOT NULL DEFAULT 100,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'توسعه وب',
  image_url text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT 'تحریریه کدآکادمی',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_notifications (
  id integer PRIMARY KEY DEFAULT 1,
  title text NOT NULL DEFAULT 'جشنواره ویژه کدآکادمی',
  message text NOT NULL,
  promo_code text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'مشاهده دوره‌ها',
  cta_link text NOT NULL DEFAULT '/courses',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security with public read & authenticated writes
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_courses" ON public.courses;
CREATE POLICY "public_read_courses" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_courses" ON public.courses;
CREATE POLICY "auth_write_courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_course_reviews" ON public.course_reviews;
CREATE POLICY "public_read_course_reviews" ON public.course_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_course_reviews" ON public.course_reviews;
CREATE POLICY "auth_write_course_reviews" ON public.course_reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_categories" ON public.categories;
CREATE POLICY "auth_write_categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_discount_codes" ON public.discount_codes;
CREATE POLICY "public_read_discount_codes" ON public.discount_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_discount_codes" ON public.discount_codes;
CREATE POLICY "auth_write_discount_codes" ON public.discount_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_promo_codes" ON public.promo_codes;
CREATE POLICY "public_read_promo_codes" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_promo_codes" ON public.promo_codes;
CREATE POLICY "auth_write_promo_codes" ON public.promo_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_learning_paths" ON public.learning_paths;
CREATE POLICY "public_read_learning_paths" ON public.learning_paths FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_learning_paths" ON public.learning_paths;
CREATE POLICY "auth_write_learning_paths" ON public.learning_paths FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_news" ON public.news;
CREATE POLICY "public_read_news" ON public.news FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_news" ON public.news;
CREATE POLICY "auth_write_news" ON public.news FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_site_settings" ON public.site_settings;
CREATE POLICY "public_read_site_settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_site_settings" ON public.site_settings;
CREATE POLICY "auth_write_site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_submissions" ON public.content_submissions;
CREATE POLICY "public_read_submissions" ON public.content_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_submissions" ON public.content_submissions;
CREATE POLICY "auth_write_submissions" ON public.content_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_notifications" ON public.site_notifications;
CREATE POLICY "public_read_notifications" ON public.site_notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "auth_write_notifications" ON public.site_notifications;
CREATE POLICY "auth_write_notifications" ON public.site_notifications FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime cross-client broadcast
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.course_reviews;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_paths;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_codes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.discount_codes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;
