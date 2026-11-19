import type {
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  PublicUser,
  UserRole,
} from "../types";
import { getSupabaseClient } from "./supabase";

export interface SupabaseUserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  enrolled_courses: unknown;
  created_at: string;
}

export interface SupabaseOrderRow {
  id: string;
  user_email: string;
  user_name: string;
  items: unknown;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface CourseLookupItem {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  price?: number;
  discountPrice?: number | null;
}

export type SupabaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; code?: string; message: string };

export function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeRole(role: unknown): UserRole {
  const upper = String(role || "STUDENT").toUpperCase();
  if (upper === "ADMIN" || upper === "INSTRUCTOR" || upper === "STUDENT") {
    return upper;
  }
  return "STUDENT";
}

export function normalizeOrderStatus(status: unknown): OrderStatus {
  const upper = String(status || "COMPLETED").toUpperCase();
  if (upper === "PENDING" || upper === "COMPLETED" || upper === "FAILED") {
    return upper;
  }
  return "COMPLETED";
}

export function normalizeEnrolledCourses(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
          .filter(Boolean)
      )
    );
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeEnrolledCourses(parsed);
    } catch {
      return raw
        .replace(/^\{|\}$/g, "")
        .split(",")
        .map((s) => s.replace(/^"|"$/g, "").trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function mergeEnrolledCourses(
  existing: string[],
  added: string[]
): string[] {
  return Array.from(
    new Set(
      [...existing, ...added]
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )
  );
}

export function mapSupabaseUserToPublicUser(row: SupabaseUserRow): PublicUser {
  return {
    id: String(row.id),
    name: String(row.name || "کاربر"),
    email: String(row.email || "").toLowerCase().trim(),
    role: normalizeRole(row.role),
    phone: null,
    bio: null,
    isActive: true,
    isEmailVerified: true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function normalizeOrderItems(
  rawItems: unknown,
  courses: CourseLookupItem[]
): OrderItemRecord[] {
  let list: unknown[] = [];
  if (Array.isArray(rawItems)) {
    list = rawItems;
  } else if (typeof rawItems === "string" && rawItems.trim()) {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }

  return list.map((entry, idx) => {
    if (typeof entry === "string") {
      const matched = courses.find(
        (c) => c.id === entry || c.slug === entry || c.title === entry
      );
      return {
        id: `oi_${idx}`,
        courseId: matched?.id ?? entry,
        courseTitle: matched?.title ?? entry,
        courseSlug: matched?.slug ?? "",
        courseThumbnail: matched?.thumbnail ?? "",
        price: matched ? matched.discountPrice ?? matched.price ?? 0 : 0,
      };
    }

    const obj = (entry && typeof entry === "object" ? entry : {}) as Record<
      string,
      unknown
    >;
    const courseId = String(obj.courseId ?? obj.course_id ?? obj.id ?? "");
    const matched = courses.find(
      (c) => c.id === courseId || c.slug === String(obj.courseSlug ?? "")
    );
    return {
      id: String(obj.id ?? `oi_${idx}`),
      courseId: courseId || matched?.id || `crs_${idx}`,
      courseTitle: String(
        obj.courseTitle ?? obj.course_title ?? obj.title ?? matched?.title ?? "دوره آموزشی"
      ),
      courseSlug: String(obj.courseSlug ?? obj.slug ?? matched?.slug ?? ""),
      courseThumbnail: String(
        obj.courseThumbnail ?? obj.thumbnail ?? matched?.thumbnail ?? ""
      ),
      price: Number(obj.price ?? 0) || 0,
    };
  });
}

export function mapSupabaseOrderToOrderRecord(
  row: SupabaseOrderRow,
  courses: CourseLookupItem[]
): OrderRecord {
  const amount = Number(row.total_amount ?? 0) || 0;
  const items = normalizeOrderItems(row.items, courses);
  const shortId = String(row.id || "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return {
    id: String(row.id),
    orderNumber: `CA-${shortId || "ORDER"}`,
    userId: String(row.user_email || "").toLowerCase(),
    userName: String(row.user_name || "کاربر"),
    userEmail: String(row.user_email || "").toLowerCase(),
    totalAmount: amount,
    discountAmount: 0,
    finalAmount: amount,
    couponCode: null,
    status: normalizeOrderStatus(row.status),
    paymentRef:
      normalizeOrderStatus(row.status) === "COMPLETED"
        ? `SB-${shortId}`
        : null,
    createdAt: row.created_at || new Date().toISOString(),
    items,
  };
}

export async function fetchSupabaseUserByEmail(
  email: string
): Promise<SupabaseResult<SupabaseUserRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const normalized = email.toLowerCase().trim();
    const { data, error } = await client
      .from("users")
      .select("id, name, email, password, role, enrolled_courses, created_at")
      .eq("email", normalized)
      .maybeSingle();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseUserRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function fetchSupabaseUserById(
  id: string
): Promise<SupabaseResult<SupabaseUserRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("users")
      .select("id, name, email, password, role, enrolled_courses, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseUserRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function fetchAllSupabaseUsers(): Promise<
  SupabaseResult<SupabaseUserRow[]>
> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("users")
      .select("id, name, email, password, role, enrolled_courses, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseUserRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function insertSupabaseUser(
  row: SupabaseUserRow
): Promise<SupabaseResult<SupabaseUserRow>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("users")
      .insert({
        id: row.id,
        name: row.name,
        email: row.email.toLowerCase().trim(),
        password: row.password,
        role: row.role,
        enrolled_courses: normalizeEnrolledCourses(row.enrolled_courses),
        created_at: row.created_at,
      })
      .select("id, name, email, password, role, enrolled_courses, created_at")
      .single();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseUserRow) ?? row };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase insert failed",
    };
  }
}

export async function updateSupabaseUserById(
  id: string,
  patch: Partial<
    Pick<SupabaseUserRow, "name" | "password" | "role" | "enrolled_courses">
  >
): Promise<SupabaseResult<SupabaseUserRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.password !== undefined) payload.password = patch.password;
    if (patch.role !== undefined) payload.role = patch.role;
    if (patch.enrolled_courses !== undefined) {
      payload.enrolled_courses = normalizeEnrolledCourses(
        patch.enrolled_courses
      );
    }

    const { data, error } = await client
      .from("users")
      .update(payload)
      .eq("id", id)
      .select("id, name, email, password, role, enrolled_courses, created_at")
      .maybeSingle();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseUserRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}

export async function updateSupabaseUserByEmail(
  email: string,
  patch: Partial<
    Pick<SupabaseUserRow, "name" | "password" | "role" | "enrolled_courses">
  >
): Promise<SupabaseResult<SupabaseUserRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.password !== undefined) payload.password = patch.password;
    if (patch.role !== undefined) payload.role = patch.role;
    if (patch.enrolled_courses !== undefined) {
      payload.enrolled_courses = normalizeEnrolledCourses(
        patch.enrolled_courses
      );
    }

    const { data, error } = await client
      .from("users")
      .update(payload)
      .eq("email", email.toLowerCase().trim())
      .select("id, name, email, password, role, enrolled_courses, created_at")
      .maybeSingle();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseUserRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}

export async function fetchAllSupabaseOrders(): Promise<
  SupabaseResult<SupabaseOrderRow[]>
> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("orders")
      .select("id, user_email, user_name, items, total_amount, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseOrderRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function fetchSupabaseOrdersByEmail(
  email: string
): Promise<SupabaseResult<SupabaseOrderRow[]>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("orders")
      .select("id, user_email, user_name, items, total_amount, status, created_at")
      .eq("user_email", email.toLowerCase().trim())
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseOrderRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function insertSupabaseOrder(
  row: SupabaseOrderRow
): Promise<SupabaseResult<SupabaseOrderRow>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("orders")
      .insert({
        id: row.id,
        user_email: row.user_email.toLowerCase().trim(),
        user_name: row.user_name,
        items: row.items,
        total_amount: row.total_amount,
        status: row.status,
        created_at: row.created_at,
      })
      .select("id, user_email, user_name, items, total_amount, status, created_at")
      .single();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseOrderRow) ?? row };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase insert failed",
    };
  }
}

export async function updateSupabaseOrderStatus(
  id: string,
  status: OrderStatus
): Promise<SupabaseResult<SupabaseOrderRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id, user_email, user_name, items, total_amount, status, created_at")
      .maybeSingle();

    if (error) {
      return { ok: false, code: error.code, message: error.message };
    }
    return { ok: true, data: (data as SupabaseOrderRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}

// --- REVIEWS (public.reviews) ---
export interface SupabaseReviewRow {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  author_role: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

export async function fetchSupabaseReviewsByCourse(
  courseId: string
): Promise<SupabaseResult<SupabaseReviewRow[]>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("reviews")
      .select(
        "id, course_id, user_id, user_name, author_role, rating, comment, status, created_at"
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseReviewRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function fetchAllSupabaseReviews(): Promise<
  SupabaseResult<SupabaseReviewRow[]>
> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("reviews")
      .select(
        "id, course_id, user_id, user_name, author_role, rating, comment, status, created_at"
      )
      .order("created_at", { ascending: false });
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseReviewRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function insertSupabaseReview(
  row: SupabaseReviewRow
): Promise<SupabaseResult<SupabaseReviewRow>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("reviews")
      .insert(row)
      .select(
        "id, course_id, user_id, user_name, author_role, rating, comment, status, created_at"
      )
      .single();
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseReviewRow) ?? row };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase insert failed",
    };
  }
}

export async function updateSupabaseReviewStatus(
  id: string,
  status: string
): Promise<SupabaseResult<SupabaseReviewRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("reviews")
      .update({ status })
      .eq("id", id)
      .select(
        "id, course_id, user_id, user_name, author_role, rating, comment, status, created_at"
      )
      .maybeSingle();
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseReviewRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}

export async function deleteSupabaseReview(
  id: string
): Promise<SupabaseResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { error } = await client.from("reviews").delete().eq("id", id);
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase delete failed",
    };
  }
}

// --- INSTRUCTORS (public.instructors) ---
export interface SupabaseInstructorRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  bio: string;
  status: string;
  created_at: string;
}

export async function fetchAllSupabaseInstructors(): Promise<
  SupabaseResult<SupabaseInstructorRow[]>
> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("instructors")
      .select(
        "id, user_id, name, email, phone, specialty, bio, status, created_at"
      )
      .order("created_at", { ascending: false });
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseInstructorRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function insertSupabaseInstructor(
  row: SupabaseInstructorRow
): Promise<SupabaseResult<SupabaseInstructorRow>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("instructors")
      .insert(row)
      .select(
        "id, user_id, name, email, phone, specialty, bio, status, created_at"
      )
      .single();
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseInstructorRow) ?? row };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase insert failed",
    };
  }
}

export async function updateSupabaseInstructorStatus(
  id: string,
  status: string
): Promise<SupabaseResult<SupabaseInstructorRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("instructors")
      .update({ status })
      .eq("id", id)
      .select(
        "id, user_id, name, email, phone, specialty, bio, status, created_at"
      )
      .maybeSingle();
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseInstructorRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}

// --- NEWS (public.news) ---
export interface SupabaseNewsRow {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  image_url: string;
  author_name: string;
  is_published: boolean;
  created_at: string;
}

export async function fetchAllSupabaseNews(): Promise<
  SupabaseResult<SupabaseNewsRow[]>
> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("news")
      .select(
        "id, title, slug, summary, content, category, image_url, author_name, is_published, created_at"
      )
      .order("created_at", { ascending: false });
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseNewsRow[] | null) ?? [] };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase fetch failed",
    };
  }
}

export async function insertSupabaseNews(
  row: SupabaseNewsRow
): Promise<SupabaseResult<SupabaseNewsRow>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("news")
      .insert(row)
      .select(
        "id, title, slug, summary, content, category, image_url, author_name, is_published, created_at"
      )
      .single();
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseNewsRow) ?? row };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase insert failed",
    };
  }
}

export async function updateSupabaseNews(
  id: string,
  patch: Partial<Omit<SupabaseNewsRow, "id" | "created_at">>
): Promise<SupabaseResult<SupabaseNewsRow | null>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { data, error } = await client
      .from("news")
      .update(patch)
      .eq("id", id)
      .select(
        "id, title, slug, summary, content, category, image_url, author_name, is_published, created_at"
      )
      .maybeSingle();
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: (data as SupabaseNewsRow | null) ?? null };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}

export async function deleteSupabaseNews(
  id: string
): Promise<SupabaseResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase client disabled" };
  try {
    const { error } = await client.from("news").delete().eq("id", id);
    if (error) return { ok: false, code: error.code, message: error.message };
    return { ok: true, data: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Supabase delete failed",
    };
  }
}
