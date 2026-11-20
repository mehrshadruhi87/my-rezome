import { getSupabaseClient } from "./supabase";
import {
  isMissingTableError,
  recordSupabaseTableStatus,
} from "./supabaseAdminSync";
import type { ReviewItem, UserRole } from "../types";

export interface CourseReviewRow {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  author_role?: string;
  rating: number;
  comment: string;
  status?: string;
  created_at: string;
}

export interface CourseRatingStats {
  averageRating: number | null;
  reviewCount: number;
}

export function computeCourseRatingStats(
  reviews: Array<{
    courseId: string;
    rating: number;
    status?: string;
  }>,
  courseId: string
): CourseRatingStats {
  const valid = reviews.filter(
    (r) =>
      r.courseId === courseId &&
      r.status !== "REJECTED" &&
      typeof r.rating === "number" &&
      Number.isFinite(r.rating) &&
      r.rating >= 1 &&
      r.rating <= 5
  );

  if (valid.length === 0) {
    return { averageRating: null, reviewCount: 0 };
  }

  const total = valid.reduce((sum, r) => sum + r.rating, 0);
  const avg = Number((total / valid.length).toFixed(1));
  return {
    averageRating: avg,
    reviewCount: valid.length,
  };
}

export function mapCourseReviewRowToItem(row: CourseReviewRow): ReviewItem {
  const roleUpper = String(row.author_role || "STUDENT").toUpperCase();
  const authorRole: UserRole =
    roleUpper === "ADMIN" || roleUpper === "INSTRUCTOR"
      ? roleUpper
      : "STUDENT";

  return {
    id: String(row.id),
    courseId: String(row.course_id),
    userId: String(row.user_id),
    userName: String(row.user_name || "دانشجو"),
    authorRole,
    rating: Math.min(5, Math.max(1, Number(row.rating) || 5)),
    comment: String(row.comment || ""),
    status:
      row.status === "PENDING" || row.status === "REJECTED"
        ? row.status
        : "APPROVED",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

const missingReadCooldown = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function inCooldown(table: string): boolean {
  const ts = missingReadCooldown.get(table);
  return Boolean(ts && Date.now() - ts < COOLDOWN_MS);
}

export async function fetchAllSupabaseCourseReviews(): Promise<{
  ok: boolean;
  data: ReviewItem[];
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: [] };

  if (!inCooldown("course_reviews")) {
    try {
      const { data, error } = await client
        .from("course_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        missingReadCooldown.delete("course_reviews");
        recordSupabaseTableStatus("course_reviews", null);
        return {
          ok: true,
          data: ((data as CourseReviewRow[] | null) ?? []).map(
            mapCourseReviewRowToItem
          ),
        };
      }

      if (isMissingTableError(error)) {
        missingReadCooldown.set("course_reviews", Date.now());
        recordSupabaseTableStatus("course_reviews", error);
      }
    } catch {
      // Fall through to legacy table attempt
    }
  }

  // Graceful fallback to legacy public.reviews table if course_reviews is not created yet
  try {
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, data: [], missingTable: true };
    }
    return {
      ok: true,
      data: ((data as CourseReviewRow[] | null) ?? []).map(
        mapCourseReviewRowToItem
      ),
    };
  } catch {
    return { ok: false, data: [], missingTable: true };
  }
}

export async function fetchSupabaseCourseReviewsByCourse(
  courseId: string
): Promise<{
  ok: boolean;
  data: ReviewItem[];
  missingTable?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, data: [] };

  if (!inCooldown("course_reviews")) {
    try {
      const { data, error } = await client
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (!error) {
        missingReadCooldown.delete("course_reviews");
        recordSupabaseTableStatus("course_reviews", null);
        return {
          ok: true,
          data: ((data as CourseReviewRow[] | null) ?? []).map(
            mapCourseReviewRowToItem
          ),
        };
      }

      if (isMissingTableError(error)) {
        missingReadCooldown.set("course_reviews", Date.now());
        recordSupabaseTableStatus("course_reviews", error);
      }
    } catch {
      // Fall through to legacy table attempt
    }
  }

  try {
    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, data: [], missingTable: true };
    }
    return {
      ok: true,
      data: ((data as CourseReviewRow[] | null) ?? []).map(
        mapCourseReviewRowToItem
      ),
    };
  } catch {
    return { ok: false, data: [], missingTable: true };
  }
}

export async function insertSupabaseCourseReview(
  row: CourseReviewRow
): Promise<{ ok: boolean; missingTable?: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };

  try {
    const { error } = await client.from("course_reviews").insert({
      id: row.id,
      course_id: row.course_id,
      user_id: row.user_id,
      user_name: row.user_name,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
    });

    if (!error) {
      missingReadCooldown.delete("course_reviews");
      recordSupabaseTableStatus("course_reviews", null);
      return { ok: true };
    }

    if (isMissingTableError(error)) {
      missingReadCooldown.set("course_reviews", Date.now());
      recordSupabaseTableStatus("course_reviews", error);
    }
  } catch {
    // Fall through to legacy table
  }

  // Fallback to legacy public.reviews
  try {
    const { error } = await client.from("reviews").insert({
      id: row.id,
      course_id: row.course_id,
      user_id: row.user_id,
      user_name: row.user_name,
      author_role: row.author_role || "STUDENT",
      rating: row.rating,
      comment: row.comment,
      status: row.status || "APPROVED",
      created_at: row.created_at,
    });
    return { ok: !error, missingTable: Boolean(error) };
  } catch {
    return { ok: false, missingTable: true };
  }
}
