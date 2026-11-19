import React, { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { apiRequest } from "../lib/api";
import { LessonPlayerModal } from "../components/course/LessonPlayerModal";
import {
  formatPersianDate,
  formatToman,
  getLevelInfo,
  toPersianDigits,
} from "../utils/formatters";
import { calculateDiscountPercent } from "../utils/pricing";
import {
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../data/courseAssets";
import type { CourseDetail, LessonItem, UserRole } from "../types";
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

function getAuthorRoleStyle(role?: UserRole) {
  if (role === "ADMIN") {
    return {
      label: "مدیریت",
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
      label: "مدرس دوره",
      icon: GraduationCap,
      cardClass:
        "border-indigo-500/50 bg-indigo-500/10 dark:bg-indigo-950/25 shadow-sm",
      badgeClass:
        "bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/40",
      avatarClass: "bg-indigo-600 text-white",
    };
  }
  return {
    label: "دانشجو",
    icon: User,
    cardClass:
      "border-slate-300/80 dark:border-slate-800/80 bg-[#F1F5F9] dark:bg-slate-950/50",
    badgeClass:
      "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
    avatarClass: "bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
  };
}

export function CourseDetailPage({ slug }: { slug: string }) {
  const { user, settings, refreshBootstrap } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const { push } = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openChapterIds, setOpenChapterIds] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ course: CourseDetail }>(
        `/api/courses/${encodeURIComponent(slug)}`
      );
      setCourse(res.course);
      if (res.course.chapters.length > 0) {
        setOpenChapterIds([res.course.chapters[0].id]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "دوره یافت نشد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [slug]);

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
          {error || "دوره مورد نظر یافت نشد"}
        </h1>
        <Link
          href="/courses"
          className="btn-3d mt-6 inline-block rounded-xl px-6 py-3 text-xs font-bold"
        >
          بازگشت به کاتالوگ دوره‌ها
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.some((w) => w.id === course.id);
  const levelInfo = getLevelInfo(course.level);
  const discountPercent = calculateDiscountPercent(
    course.price,
    course.discountPrice
  );
  const totalLessons = course.chapters.reduce(
    (sum, ch) => sum + ch.lessons.length,
    0
  );
  const hasFullUnlock = Boolean(course.isEnrolled || course.fullAccess);
  const firstFreeLesson =
    course.chapters.flatMap((c) => c.lessons).find((l) => l.isFree || hasFullUnlock) ??
    course.chapters[0]?.lessons[0] ??
    null;

  const toggleChapter = (id: string) => {
    setOpenChapterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    const added = addToCart({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      instructorName: course.instructorName,
      price: course.price,
      discountPrice: course.discountPrice,
    });
    if (added) toast.success("دوره به سبد خرید اضافه شد.");
    else toast.info("این دوره در سبد خرید شما موجود است.");
    push("/cart");
  };

  const handleEnrollFree = async () => {
    if (!user) {
      push(`/auth/login?redirect=/courses/${course.slug}`);
      return;
    }
    try {
      const init = await apiRequest<{ orderId: string }>("/api/checkout/initiate", {
        method: "POST",
        body: JSON.stringify({ courseIds: [course.id] }),
      });
      await apiRequest("/api/checkout/verify", {
        method: "POST",
        body: JSON.stringify({ orderId: init.orderId, status: "SUCCESS" }),
      });
      toast.success("ثبت‌نام رایگان با موفقیت انجام شد!");
      await refreshBootstrap();
      await fetchCourse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("متن دیدگاه نمی‌تواند خالی باشد.");
      return;
    }
    setSubmittingReview(true);
    try {
      await apiRequest(`/api/courses/${course.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      toast.success("دیدگاه شما با موفقیت ثبت شد.");
      setReviewComment("");
      await fetchCourse();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت دیدگاه");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
      {activeLesson && (
        <LessonPlayerModal
          courseTitle={course.title}
          chapters={course.chapters}
          activeLesson={activeLesson}
          isEnrolled={hasFullUnlock}
          onSelectLesson={setActiveLesson}
          onClose={() => setActiveLesson(null)}
        />
      )}

      {/* Breadcrumb */}
      <nav
        aria-label="مسیر صفحه"
        className="mb-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
      >
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
          خانه
        </Link>
        <span>/</span>
        <Link
          href={`/courses?category=${course.category?.slug ?? "all"}`}
          className="hover:text-slate-900 dark:hover:text-white"
        >
          {course.category?.name ?? "دوره‌ها"}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold truncate">
          {course.title}
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
                alt={course.title}
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
                    <span>مشاهده پیش‌نمایش دوره</span>
                  </button>
                )}
                {course.fullAccess && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/90 px-3 py-1.5 text-xs font-black text-slate-950">
                    <Sparkles className="h-3.5 w-3.5" />
                    دسترسی کامل فعال
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                  {course.category.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className={levelInfo.textClass}>{levelInfo.label}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {toPersianDigits(course.studentsCount)} دانشجو
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {toPersianDigits(course.rating.toFixed(1))}
                </span>
              </div>

              <h1 className="text-2xl font-black leading-snug text-slate-900 dark:text-white sm:text-3xl">
                {course.title}
              </h1>

              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {course.shortDesc}
              </p>
            </div>
          </div>

          {/* Description */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              توضیحات جامع دوره
            </h2>
            <p className="text-sm leading-loose text-slate-700 dark:text-slate-300">
              {course.description}
            </p>
          </section>

          {/* Curriculum + Attachments */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                سرفصل‌ها، جلسات و فایل‌های ضمیمه
              </h2>
              <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                {toPersianDigits(course.chapters.length)} فصل ·{" "}
                {toPersianDigits(totalLessons)} جلسه · {course.duration}
              </span>
            </div>

            <div className="space-y-3">
              {course.chapters.map((chapter) => {
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
                      className="flex w-full items-center justify-between px-4 py-3.5 text-right hover:bg-[#E2E8F0] dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {chapter.title}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          {toPersianDigits(chapter.lessons.length)} جلسه
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
                                      رایگان
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
                                      پخش
                                    </button>
                                  )}
                                </div>
                              </div>

                              {attachments.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pr-6">
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
                                        <span>{att.title} (پس از ثبت‌نام)</span>
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
              {course.instructorName[0]}
            </div>
            <div>
              <span className="text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                مدرس دوره
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {course.instructorName}
              </h3>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {course.instructorTitle}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {course.instructorBio}
              </p>
            </div>
          </section>

          {/* Role-Based Reviews & Comments */}
          <section className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                دیدگاه‌ها و پرسش و پاسخ ({toPersianDigits(course.reviews.length)})
              </h2>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="h-3 w-3" /> مدیریت
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2 py-0.5 font-bold text-indigo-800 dark:text-indigo-300">
                  <GraduationCap className="h-3 w-3" /> مدرس دوره
                </span>
              </div>
            </div>

            {!settings.allowReviews ? (
              <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-4 text-xs text-slate-600 dark:text-slate-400">
                ثبت دیدگاه جدید در حال حاضر توسط مدیریت غیرفعال شده است.
              </div>
            ) : user ? (
              <form
                onSubmit={handleSubmitReview}
                className="space-y-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="review-comment"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <span>دیدگاه یا پاسخ خود را بنویسید</span>
                    <span className="rounded-md border border-slate-300 dark:border-slate-700 bg-[#E2E8F0] dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      ارسال به عنوان:{" "}
                      {user.role === "ADMIN"
                        ? "مدیریت"
                        : user.role === "INSTRUCTOR"
                        ? "مدرس دوره"
                        : "دانشجو"}
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`امتیاز ${toPersianDigits(star)} ستاره`}
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
                  placeholder="نظر، سوال یا راهنمایی فنی خود را بنویسید..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:border-[var(--accent-500)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-3d rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50"
                >
                  {submittingReview ? "در حال ثبت..." : "ثبت دیدگاه"}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-4 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید.</span>
                <Link
                  href={`/auth/login?redirect=/courses/${course.slug}`}
                  className="font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)] hover:underline"
                >
                  ورود به حساب
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {course.reviews.length === 0 ? (
                <p className="text-xs text-slate-500">
                  هنوز دیدگاهی برای این دوره ثبت نشده است.
                </p>
              ) : (
                course.reviews.map((rev) => {
                  const roleStyle = getAuthorRoleStyle(rev.authorRole);
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
                            {toPersianDigits(rev.rating)}
                          </span>
                          <span>·</span>
                          <span>{formatPersianDate(rev.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 pr-10">
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
              شهریه دوره
            </span>
            <div className="text-left tabular-nums">
              {discountPercent > 0 && (
                <div className="text-xs text-slate-500 line-through">
                  {formatToman(course.price)}
                </div>
              )}
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatToman(course.discountPrice ?? course.price)}
              </div>
            </div>
          </div>

          {hasFullUnlock ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/12 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {course.isEnrolled
                    ? "شما دانشجوی این دوره هستید"
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
                  <span>شروع یادگیری و مشاهده جلسات</span>
                </button>
              )}
            </div>
          ) : (course.discountPrice ?? course.price) === 0 ? (
            <button
              type="button"
              onClick={handleEnrollFree}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white hover:bg-emerald-500 transition-colors shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>ثبت‌نام رایگان در دوره</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-3d flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>افزودن به سبد خرید</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const added = toggleWishlist({
                id: course.id,
                title: course.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                instructorName: course.instructorName,
                price: course.price,
                discountPrice: course.discountPrice,
              });
              toast[added ? "success" : "info"](
                added ? "به علاقه‌مندی‌ها اضافه شد." : "از علاقه‌مندی‌ها حذف شد."
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
              {isWishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            </span>
          </button>

          <dl className="divide-y divide-slate-300/80 dark:divide-slate-800/80 border-t border-slate-300 dark:border-slate-800 pt-2 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>مدت آموزش</span>
              </dt>
              <dd className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                {course.duration}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span>تعداد جلسات</span>
              </dt>
              <dd className="font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                {toPersianDigits(totalLessons)} درس
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4 text-slate-500" />
                <span>پیش‌نیاز</span>
              </dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-200 text-left max-w-[160px]">
                {course.prerequisites}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Globe className="h-4 w-4 text-slate-500" />
                <span>زبان</span>
              </dt>
              <dd className="font-bold text-slate-900 dark:text-slate-200">
                {course.language}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Award className="h-4 w-4 text-slate-500" />
                <span>گواهینامه</span>
              </dt>
              <dd className="font-bold text-emerald-700 dark:text-emerald-400">
                مدرک معتبر پایان دوره
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
