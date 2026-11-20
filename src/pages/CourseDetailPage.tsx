import React, { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useStore } from "../store/useStore";
import { apiRequest } from "../lib/api";
import { getDictionary } from "../lib/i18n";
import { localizeCourseDetail } from "../lib/contentLocalization";
import {
  CODEACADEMY_REALTIME_EVENT,
  dispatchRealtimeUpdate,
  type RealtimeSyncEventDetail,
} from "../lib/realtimeSync";
import { computeCourseRatingStats } from "../lib/courseReviews";
import { supabase } from "../lib/supabase";
import { mapSupabaseAuthUserToPublicUser } from "../lib/supabaseAuth";
import { syncSupabaseAuthSessionToLocalStore } from "../lib/localBackend";
import {
  fetchSupabaseCourseReviewsForCourse,
  generateUuid,
  insertSupabaseCourseReviewRecord,
  loadCourseReviewsFromLocalCache,
  normalizeRole,
  readFallbackSessionUser,
  saveCourseReviewToLocalCache,
  type SupabaseCourseReviewRow,
} from "../lib/supabaseStore";
import { LessonPlayerModal } from "../components/course/LessonPlayerModal";
import {
  formatDigits,
  formatPersianDate,
  formatToman,
  getLevelInfo,
} from "../utils/formatters";
import { calculateDiscountPercent } from "../utils/pricing";
import {
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../data/courseAssets";
import type {
  CourseDetail,
  LessonItem,
  PublicUser,
  ReviewItem,
  UserRole,
} from "../types";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Lock,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";

function getAuthorRoleStyle(role: UserRole | undefined, isEn: boolean) {
  if (role === "ADMIN") {
    return {
      label: isEn ? "Admin" : "مدیریت",
      icon: ShieldCheck,
      cardClass:
        "border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/25 shadow-sm",
      badgeClass:
        "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40",
      avatarClass: "bg-amber-600 text-white",
    };
  }
  if (role === "INSTRUCTOR") {
    return {
      label: isEn ? "Instructor" : "مدرس دوره",
      icon: GraduationCap,
      cardClass:
        "border-indigo-500/50 bg-indigo-500/10 dark:bg-indigo-950/25 shadow-sm",
      badgeClass:
        "bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/40",
      avatarClass: "bg-indigo-600 text-white",
    };
  }
  return {
    label: isEn ? "Student" : "دانشجو",
    icon: User,
    cardClass:
      "border-slate-300/80 dark:border-slate-800/80 bg-[#F1F5F9] dark:bg-slate-950/50",
    badgeClass:
      "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    avatarClass:
      "bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
  };
}

function mapCourseReviewRowToReviewItem(
  row: SupabaseCourseReviewRow
): ReviewItem {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    userId: String(row.user_id),
    userName: String(row.user_name || "کاربر کدآکادمی"),
    authorRole: normalizeRole(row.author_role),
    rating: Math.min(5, Math.max(1, Number(row.rating) || 5)),
    comment: String(row.comment || ""),
    status:
      row.status === "PENDING" || row.status === "REJECTED"
        ? row.status
        : "APPROVED",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mergeCourseReviewsList(
  courseId: string,
  ...lists: ReviewItem[][]
): ReviewItem[] {
  const byId = new Map<string, ReviewItem>();
  const seenFingerprint = new Set<string>();

  for (const list of lists) {
    for (const item of list) {
      if (!item || item.courseId !== courseId || item.status === "REJECTED") {
        continue;
      }
      const fingerprint = `${item.userId}::${item.rating}::${item.comment.trim()}`;
      if (byId.has(item.id) || seenFingerprint.has(fingerprint)) {
        continue;
      }
      byId.set(item.id, item);
      seenFingerprint.add(fingerprint);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function CourseDetailPage({ slug }: { slug: string }) {
  const { user, settings, refreshBootstrap } = useAuth();
  const { language, isRtl } = useUserPreferences();
  const t = getDictionary(language);
  const isEn = language === "en";
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const { push } = useRouter();

  const [fallbackUser, setFallbackUser] = useState<PublicUser | null>(() =>
    readFallbackSessionUser()
  );
  const activeUser: PublicUser | null = user ?? fallbackUser;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openChapterIds, setOpenChapterIds] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Keep fallback session user synced with AuthContext, localStorage, and live Supabase session
  useEffect(() => {
    if (user) {
      setFallbackUser(user);
      return;
    }
    const cached = readFallbackSessionUser();
    setFallbackUser(cached);
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        const sbUser = data?.session?.user;
        if (sbUser) {
          const mapped = mapSupabaseAuthUserToPublicUser(sbUser);
          setFallbackUser(mapped);
          syncSupabaseAuthSessionToLocalStore(mapped);
        } else if (!cached) {
          setFallbackUser(null);
        }
      })
      .catch(() => {
        // Keep cached fallback user if offline
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  const fetchCourse = useCallback(async () => {
    setError(null);
    try {
      const res = await apiRequest<{ course: CourseDetail }>(
        `/api/courses/${encodeURIComponent(slug)}`
      );
      const loadedCourse = res.course;

      // Merge live Supabase course_reviews + local cache so submitted reviews always persist
      const cachedRows = loadCourseReviewsFromLocalCache(loadedCourse.id).map(
        mapCourseReviewRowToReviewItem
      );
      let remoteRows: ReviewItem[] = [];
      try {
        const sbRes = await fetchSupabaseCourseReviewsForCourse(
          loadedCourse.id
        );
        if (sbRes.ok && sbRes.data.length > 0) {
          remoteRows = sbRes.data.map(mapCourseReviewRowToReviewItem);
        }
      } catch {
        // Non-blocking fallback to API + local cache
      }

      const mergedReviews = mergeCourseReviewsList(
        loadedCourse.id,
        remoteRows,
        cachedRows,
        loadedCourse.reviews
      );
      const stats = computeCourseRatingStats(mergedReviews, loadedCourse.id);

      setCourse({
        ...loadedCourse,
        reviews: mergedReviews,
        rating: stats.averageRating ?? 0,
        reviewCount: stats.reviewCount,
      });
      setOpenChapterIds((prev) =>
        prev.length > 0
          ? prev
          : loadedCourse.chapters.length > 0
            ? [loadedCourse.chapters[0].id]
            : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEn
            ? "Course not found."
            : "دوره یافت نشد."
      );
    } finally {
      setLoading(false);
    }
  }, [slug, isEn]);

  useEffect(() => {
    setLoading(true);
    void fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<RealtimeSyncEventDetail>).detail;
      if (
        !detail ||
        detail.table === "courses" ||
        detail.table === "course_reviews"
      ) {
        void fetchCourse();
      }
    };
    window.addEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    return () => {
      window.removeEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    };
  }, [fetchCourse]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="h-80 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          {error || (isEn ? "Course not found" : "دوره مورد نظر یافت نشد")}
        </h1>
        <Link
          href="/courses"
          className="btn-3d mt-6 inline-block rounded-xl px-6 py-3 text-xs font-bold"
        >
          {isEn ? "Back to Course Catalog" : "بازگشت به کاتالوگ دوره‌ها"}
        </Link>
      </div>
    );
  }

  const localizedCourse = localizeCourseDetail(course, language);
  const isWishlisted = wishlist.some((w) => w.id === course.id);
  const levelInfo = getLevelInfo(course.level, language);
  const discountPercent = calculateDiscountPercent(
    course.price,
    course.discountPrice
  );
  const totalLessons = localizedCourse.chapters.reduce(
    (sum, ch) => sum + ch.lessons.length,
    0
  );
  const hasFullUnlock = Boolean(course.isEnrolled || course.fullAccess);
  const isFreeCourse = (course.discountPrice ?? course.price) === 0;
  const reviewCount = course.reviewCount ?? course.reviews.length;
  const hasRatings = reviewCount > 0 && course.rating > 0;

  const firstFreeLesson =
    localizedCourse.chapters
      .flatMap((c) => c.lessons)
      .find((l) => l.isFree || hasFullUnlock) ??
    localizedCourse.chapters[0]?.lessons[0] ??
    null;

  const toggleChapter = (id: string) => {
    setOpenChapterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    const added = addToCart({
      id: course.id,
      title: localizedCourse.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      instructorName: localizedCourse.instructorName,
      price: course.price,
      discountPrice: course.discountPrice,
    });
    if (added) toast.success(t.courseCard.addedToCart);
    else toast.info(t.courseCard.alreadyInCart);
    push("/cart");
  };

  const handleEnrollFree = async () => {
    if (!activeUser) {
      push(`/auth/login?redirect=/courses/${course.slug}`);
      return;
    }
    try {
      syncSupabaseAuthSessionToLocalStore(activeUser);
      const init = await apiRequest<{ orderId: string }>(
        "/api/checkout/initiate",
        {
          method: "POST",
          body: JSON.stringify({ courseIds: [course.id] }),
        }
      );
      await apiRequest("/api/checkout/verify", {
        method: "POST",
        body: JSON.stringify({ orderId: init.orderId, status: "SUCCESS" }),
      });
      toast.success(
        isEn
          ? "Free enrollment completed successfully!"
          : "ثبت‌نام رایگان با موفقیت انجام شد!"
      );
      await refreshBootstrap();
      await fetchCourse();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEn
            ? "Enrollment failed"
            : "خطا در ثبت‌نام"
      );
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      toast.error(
        isEn
          ? "Review comment cannot be empty."
          : "متن دیدگاه نمی‌تواند خالی باشد."
      );
      return;
    }

    setSubmittingReview(true);
    try {
      // Resolve active user from AuthContext, fallback localStorage session, or live Supabase Auth
      let resolvedUser: PublicUser | null =
        activeUser ?? readFallbackSessionUser();
      if (!resolvedUser) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            resolvedUser = mapSupabaseAuthUserToPublicUser(data.session.user);
            setFallbackUser(resolvedUser);
          }
        } catch {
          // Ignore session lookup error
        }
      }

      if (!resolvedUser) {
        toast.error(
          isEn
            ? "Please sign in to submit a review."
            : "برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید"
        );
        return;
      }

      // Ensure local auth session store stays synced with active user
      syncSupabaseAuthSessionToLocalStore(resolvedUser);

      const numericRating = Math.min(5, Math.max(1, Number(reviewRating) || 5));
      const reviewId = generateUuid();
      const createdAt = new Date().toISOString();
      const authorRole: UserRole =
        resolvedUser.email.toLowerCase() === "mehrshadruhi87@gmail.com"
          ? "ADMIN"
          : resolvedUser.role;

      const row: SupabaseCourseReviewRow = {
        id: reviewId,
        course_id: course.id,
        user_id: resolvedUser.id,
        user_name: resolvedUser.name || "کاربر کدآکادمی",
        author_role: authorRole,
        rating: numericRating,
        comment: trimmedComment,
        status: "APPROVED",
        created_at: createdAt,
      };

      // 1. Persist locally immediately so it never gets lost on refresh or RLS mismatch
      saveCourseReviewToLocalCache(row);

      // 2. Persist to Supabase `course_reviews` table (non-blocking if RLS/table pending)
      const sbInsert = await insertSupabaseCourseReviewRecord(row);
      const savedRow = sbInsert.ok ? sbInsert.data : row;
      if (sbInsert.ok && savedRow.id !== row.id) {
        saveCourseReviewToLocalCache(savedRow);
      }

      // 3. Best-effort sync to local backend store so catalog cards & admin stay aligned
      try {
        await apiRequest(`/api/courses/${course.id}/reviews`, {
          method: "POST",
          body: JSON.stringify({
            rating: numericRating,
            comment: trimmedComment,
          }),
        });
      } catch {
        // Local cache + Supabase insert already succeeded; never abort user feedback
      }

      const newReviewItem: ReviewItem = {
        id: String(savedRow.id || reviewId),
        courseId: course.id,
        userId: resolvedUser.id,
        userName: resolvedUser.name || "کاربر کدآکادمی",
        authorRole,
        rating: numericRating,
        comment: trimmedComment,
        status: "APPROVED",
        createdAt: savedRow.created_at || createdAt,
      };

      // 4. Immediately update visible reviews list and recalculate average star rating & count
      setCourse((prev) => {
        if (!prev) return prev;
        const nextReviews = mergeCourseReviewsList(
          prev.id,
          [newReviewItem],
          prev.reviews
        );
        const stats = computeCourseRatingStats(nextReviews, prev.id);
        return {
          ...prev,
          reviews: nextReviews,
          rating: stats.averageRating ?? numericRating,
          reviewCount: stats.reviewCount,
        };
      });

      setReviewComment("");
      setReviewRating(5);
      dispatchRealtimeUpdate("course_reviews", "INSERT");
      toast.success(
        isEn
          ? "Your rating and review were submitted successfully."
          : "دیدگاه و امتیاز شما با موفقیت ثبت شد"
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEn
            ? "Failed to submit review"
            : "خطا در ثبت دیدگاه"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
      {activeLesson && (
        <LessonPlayerModal
          courseTitle={localizedCourse.title}
          chapters={localizedCourse.chapters}
          activeLesson={activeLesson}
          isEnrolled={hasFullUnlock}
          onSelectLesson={setActiveLesson}
          onClose={() => setActiveLesson(null)}
        />
      )}

      {/* Breadcrumb */}
      <nav
        aria-label={isEn ? "Breadcrumb" : "مسیر صفحه"}
        className="mb-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
      >
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          {t.drawer.home}
        </Link>
        <span>/</span>
        <Link
          href={`/courses?category=${course.category?.slug ?? "all"}`}
          className="hover:text-slate-900 dark:hover:text-white"
        >
          {localizedCourse.category?.name ?? t.nav.courses}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold truncate">
          {localizedCourse.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Hero Visual */}
          <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900">
            <div className="relative aspect-video w-full bg-slate-950">
              <img
                src={resolveCourseThumbnail(course.thumbnail)}
                alt={localizedCourse.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end justify-between p-6">
                {firstFreeLesson && (
                  <button
                    type="button"
                    onClick={() => setActiveLesson(firstFreeLesson)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-white transition-colors shadow-lg"
                  >
                    <PlayCircle className="h-4 w-4 text-indigo-600" />
                    <span>
                      {isEn ? "Watch Course Preview" : "مشاهده پیش‌نمایش دوره"}
                    </span>
                  </button>
                )}
                {course.fullAccess && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/90 px-3 py-1.5 text-xs font-black text-slate-950">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isEn ? "Full Access Unlocked" : "دسترسی کامل فعال"}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                  {localizedCourse.category.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className={levelInfo.textClass}>{levelInfo.label}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {formatDigits(course.studentsCount, language)}{" "}
                  {t.courseCard.students}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  data-testid="course-detail-rating"
                  className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold tabular-nums"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {hasRatings ? (
                    <>
                      <span>
                        {formatDigits(course.rating.toFixed(1), language)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        ({formatDigits(reviewCount, language)})
                      </span>
                    </>
                  ) : (
                    <span>{t.courseCard.newBadge}</span>
                  )}
                </span>
              </div>

              <h1 className="text-2xl font-black leading-snug text-slate-900 dark:text-white sm:text-3xl">
                {localizedCourse.title}
              </h1>

              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {localizedCourse.shortDesc}
              </p>
            </div>
          </div>

          {/* Description */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isEn ? "Comprehensive Course Overview" : "توضیحات جامع دوره"}
            </h2>
            <p className="text-sm leading-loose text-slate-700 dark:text-slate-300">
              {localizedCourse.description}
            </p>
          </section>

          {/* Curriculum + Attachments */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isEn
                  ? "Curriculum, Lessons & Attachments"
                  : "سرفصل‌ها، جلسات و فایل‌های ضمیمه"}
              </h2>
              <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                {formatDigits(localizedCourse.chapters.length, language)}{" "}
                {isEn ? "chapters" : "فصل"} ·{" "}
                {formatDigits(totalLessons, language)}{" "}
                {isEn ? "lessons" : "جلسه"} · {localizedCourse.duration}
              </span>
            </div>

            <div className="space-y-3">
              {localizedCourse.chapters.map((chapter) => {
                const isOpen = openChapterIds.includes(chapter.id);
                return (
                  <div
                    key={chapter.id}
                    className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between px-4 py-3.5 ${
                        isRtl ? "text-right" : "text-left"
                      } hover:bg-[#E2E8F0] dark:hover:bg-slate-800/50 transition-colors`}
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {chapter.title}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          {formatDigits(chapter.lessons.length, language)}{" "}
                          {isEn ? "lessons" : "جلسه"}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-slate-300/70 dark:divide-slate-800/70 border-t border-slate-300 dark:border-slate-800">
                        {chapter.lessons.map((lesson) => {
                          const canPlay = lesson.isFree || hasFullUnlock;
                          const attachments = lesson.attachments || [];
                          return (
                            <div
                              key={lesson.id}
                              className="px-4 py-3 text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {canPlay ? (
                                    <PlayCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                                  )}
                                  <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                                    {lesson.title}
                                  </span>
                                  {lesson.isFree && (
                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                                      {isEn ? "Free" : "رایگان"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-slate-600 dark:text-slate-400 tabular-nums">
                                    {lesson.duration}
                                  </span>
                                  {canPlay && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveLesson(lesson)}
                                      className="rounded-lg bg-[var(--accent-600)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)] hover:bg-[var(--accent-600)] hover:text-white transition-colors"
                                    >
                                      {isEn ? "Play" : "پخش"}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {attachments.length > 0 && (
                                <div
                                  className={`flex flex-wrap items-center gap-2 ${
                                    isRtl ? "pr-6" : "pl-6"
                                  }`}
                                >
                                  {attachments.map((att) =>
                                    canPlay ? (
                                      <a
                                        key={att.id}
                                        href={att.fileUrl}
                                        download={att.title}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#E9EFF6] dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-[var(--accent-500)] hover:text-[var(--accent-700)] dark:hover:text-[var(--accent-300)] transition-colors"
                                      >
                                        <Download className="h-3 w-3" />
                                        <span>{att.title}</span>
                                        {att.fileSize && (
                                          <span className="text-[10px] text-slate-500">
                                            ({att.fileSize})
                                          </span>
                                        )}
                                      </a>
                                    ) : (
                                      <span
                                        key={att.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/70 dark:border-slate-800 px-2.5 py-1 text-[11px] text-slate-500"
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span>
                                          {att.title}{" "}
                                          {isEn
                                            ? "(After Enrollment)"
                                            : "(پس از ثبت‌نام)"}
                                        </span>
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Instructor */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-600)]/15 text-lg font-black text-[var(--accent-700)] dark:text-[var(--accent-400)]">
              {localizedCourse.instructorName[0]}
            </div>
            <div>
              <span className="text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                {isEn ? "Course Instructor" : "مدرس دوره"}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {localizedCourse.instructorName}
              </h3>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {localizedCourse.instructorTitle}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {localizedCourse.instructorBio}
              </p>
            </div>
          </section>

          {/* Student Star Ratings & Reviews */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isEn
                  ? `Student Ratings & Reviews (${localizedCourse.reviews.length})`
                  : `امتیازدهی دانشجویان و دیدگاه‌ها (${formatDigits(
                      localizedCourse.reviews.length,
                      language
                    )})`}
              </h2>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="h-3 w-3" />{" "}
                  {isEn ? "Admin" : "مدیریت"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2 py-0.5 font-bold text-indigo-800 dark:text-indigo-300">
                  <GraduationCap className="h-3 w-3" />{" "}
                  {isEn ? "Instructor" : "مدرس دوره"}
                </span>
              </div>
            </div>

            {!settings.allowReviews ? (
              <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-4 text-xs text-slate-600 dark:text-slate-400">
                {isEn
                  ? "New reviews are currently paused by the administrator."
                  : "ثبت دیدگاه جدید در حال حاضر توسط مدیریت غیرفعال شده است."}
              </div>
            ) : !activeUser ? (
              <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-4 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
                <span>
                  {isEn
                    ? "Sign in to submit a 1–5 star rating and review for this course."
                    : "برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید."}
                </span>
                <Link
                  href={`/auth/login?redirect=/courses/${course.slug}`}
                  className="font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)] hover:underline"
                >
                  {isEn ? "Sign In" : "ورود به حساب"}
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                data-testid="course-review-form"
                className="space-y-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="review-comment"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <span>
                      {isEn
                        ? "Rate this course (1–5 stars) & write your review"
                        : "امتیاز (۱ تا ۵ ستاره) و دیدگاه خود را ثبت کنید"}
                    </span>
                    <span className="rounded-md border border-slate-300 dark:border-slate-700 bg-[#E2E8F0] dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {isEn ? "Posting as:" : "ارسال به عنوان:"}{" "}
                      {activeUser.role === "ADMIN"
                        ? isEn
                          ? "Admin"
                          : "مدیریت"
                        : activeUser.role === "INSTRUCTOR"
                          ? isEn
                            ? "Instructor"
                            : "مدرس دوره"
                          : activeUser.name || (isEn ? "Student" : "دانشجو")}
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        data-testid={`review-star-${star}`}
                        aria-label={
                          isEn
                            ? `Rate ${star} stars`
                            : `امتیاز ${formatDigits(star, language)} ستاره`
                        }
                        onClick={() => setReviewRating(star)}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-400 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="review-comment"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isEn
                      ? "Share your honest experience, feedback, or technical question..."
                      : "نظر، تجربه یادگیری یا سوال فنی خود را بنویسید..."
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:border-[var(--accent-500)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  data-testid="review-submit-btn"
                  className="btn-3d rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50"
                >
                  {submittingReview
                    ? isEn
                      ? "Submitting..."
                      : "در حال ثبت..."
                    : isEn
                      ? "Submit Rating & Review"
                      : "ثبت امتیاز و دیدگاه"}
                </button>
              </form>
            )}

            <div className="space-y-4">
              {localizedCourse.reviews.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {isEn
                    ? "No student reviews yet — be the first to rate this course!"
                    : "هنوز دیدگاهی برای این دوره ثبت نشده است."}
                </p>
              ) : (
                localizedCourse.reviews.map((rev) => {
                  const roleStyle = getAuthorRoleStyle(rev.authorRole, isEn);
                  const RoleIcon = roleStyle.icon;
                  return (
                    <div
                      key={rev.id}
                      className={`rounded-xl border p-4 space-y-2.5 transition-colors ${roleStyle.cardClass}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${roleStyle.avatarClass}`}
                          >
                            {rev.userName[0]}
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {rev.userName}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${roleStyle.badgeClass}`}
                          >
                            <RoleIcon className="h-3 w-3" />
                            {roleStyle.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {formatDigits(rev.rating, language)}
                          </span>
                          <span>·</span>
                          <span>
                            {formatPersianDate(rev.createdAt, language)}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-xs leading-relaxed text-slate-700 dark:text-slate-200 ${
                          isRtl ? "pr-10" : "pl-10"
                        }`}
                      >
                        {rev.comment}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Sticky Purchase Module */}
        <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-6 space-y-5 shadow-lg">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {isEn ? "Tuition" : "شهریه دوره"}
            </span>
            <div className={`${isRtl ? "text-left" : "text-right"} tabular-nums`}>
              {discountPercent > 0 && (
                <div className="text-xs text-slate-500 line-through">
                  {formatToman(course.price, language)}
                </div>
              )}
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatToman(course.discountPrice ?? course.price, language)}
              </div>
            </div>
          </div>

          {hasFullUnlock ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/12 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {course.isEnrolled
                    ? isEn
                      ? "You are enrolled in this course"
                      : "شما دانشجوی این دوره هستید"
                    : isEn
                      ? "Full access to all lessons is unlocked"
                      : "دسترسی کامل به تمامی جلسات باز است"}
                </span>
              </div>
              {firstFreeLesson && (
                <button
                  type="button"
                  onClick={() => setActiveLesson(firstFreeLesson)}
                  className="btn-3d flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>
                    {isEn
                      ? "Start Learning & Watch Lessons"
                      : "شروع یادگیری و مشاهده جلسات"}
                  </span>
                </button>
              )}
            </div>
          ) : isFreeCourse ? (
            <button
              type="button"
              onClick={handleEnrollFree}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white hover:bg-emerald-500 transition-colors shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isEn ? "Enroll Free in Course" : "ثبت‌نام رایگان در دوره"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-3d flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{isEn ? "Add to Cart" : "افزودن به سبد خرید"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const added = toggleWishlist({
                id: course.id,
                title: localizedCourse.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                instructorName: localizedCourse.instructorName,
                price: course.price,
                discountPrice: course.discountPrice,
              });
              toast[added ? "success" : "info"](
                added ? t.courseCard.addedWishlist : t.courseCard.removedWishlist
              );
            }}
            className="btn-3d-secondary flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold"
          >
            <Heart
              className={`h-4 w-4 ${
                isWishlisted ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
            <span>
              {isWishlisted
                ? t.courseCard.removeWishlistAria
                : t.courseCard.addWishlistAria}
            </span>
          </button>

          <dl className="divide-y divide-slate-300/80 dark:divide-slate-800/80 border-t border-slate-300 dark:border-slate-800 pt-2 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>{isEn ? "Duration" : "مدت آموزش"}</span>
              </dt>
              <dd className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                {localizedCourse.duration}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span>{isEn ? "Total Lessons" : "تعداد جلسات"}</span>
              </dt>
              <dd className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                {formatDigits(totalLessons, language)}{" "}
                {isEn ? "lessons" : "درس"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4 text-slate-500" />
                <span>{isEn ? "Prerequisites" : "پیش‌نیاز"}</span>
              </dt>
              <dd
                className={`font-semibold text-slate-900 dark:text-slate-200 ${
                  isRtl ? "text-left" : "text-right"
                } max-w-[160px]`}
              >
                {localizedCourse.prerequisites}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Globe className="h-4 w-4 text-slate-500" />
                <span>{isEn ? "Language" : "زبان"}</span>
              </dt>
              <dd className="font-bold text-slate-900 dark:text-slate-200">
                {localizedCourse.language}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Award className="h-4 w-4 text-slate-500" />
                <span>{isEn ? "Certificate" : "گواهینامه"}</span>
              </dt>
              <dd className="font-bold text-emerald-700 dark:text-emerald-400">
                {isEn ? "Verified Completion Cert" : "مدرک معتبر پایان دوره"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
