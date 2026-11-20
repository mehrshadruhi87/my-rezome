import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { getDictionary } from "../lib/i18n";
import { localizeCategory } from "../lib/contentLocalization";
import {
  CODEACADEMY_REALTIME_EVENT,
  type RealtimeSyncEventDetail,
} from "../lib/realtimeSync";
import { apiRequest } from "../lib/api";
import { CourseCard } from "../components/course/CourseCard";
import { CourseFilters } from "../components/course/CourseFilters";
import { formatDigits } from "../utils/formatters";
import type { CourseSummary } from "../types";
import { BookOpen } from "lucide-react";

export function CoursesPage() {
  const { categories } = useAuth();
  const { language } = useUserPreferences();
  const t = getDictionary(language);
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = searchParams.toString();

  const loadCourses = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest<{ courses: CourseSummary[] }>(
        `/api/courses${queryString ? `?${queryString}` : ""}`
      );
      setCourses(res.courses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : language === "en"
            ? "Failed to load courses"
            : "خطا در بارگذاری"
      );
    } finally {
      setLoading(false);
    }
  }, [queryString, language]);

  useEffect(() => {
    setLoading(true);
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<RealtimeSyncEventDetail>).detail;
      if (
        !detail ||
        detail.table === "courses" ||
        detail.table === "course_reviews" ||
        detail.table === "categories"
      ) {
        void loadCourses();
      }
    };
    window.addEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    return () => {
      window.removeEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    };
  }, [loadCourses]);

  const activeCategorySlug = searchParams.get("category") || "";
  const matchedCategory = categories.find((c) => c.slug === activeCategorySlug);
  const activeCategoryName = matchedCategory
    ? localizeCategory(matchedCategory, language).name
    : "";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
            {t.coursesPage.kicker}
          </span>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {activeCategoryName
              ? `${t.coursesPage.titleCategoryPrefix} ${activeCategoryName}`
              : t.coursesPage.titleAll}
          </h1>
        </div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
          {loading
            ? t.coursesPage.searching
            : `${formatDigits(courses.length, language)} ${t.coursesPage.foundSuffix}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <CourseFilters categories={categories} />
        </div>

        <div className="lg:col-span-3">
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/50 p-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFE7F2] dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.coursesPage.emptyTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {t.coursesPage.emptySub}
              </p>
              <button
                type="button"
                onClick={() => push("/courses")}
                className="btn-3d mt-5 rounded-xl px-5 py-2.5 text-xs font-bold"
              >
                {t.coursesPage.viewAll}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
