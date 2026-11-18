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
import type { CourseDetail, LessonItem } from "../types";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  Heart,
  Lock,
  PlayCircle,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";

export function CourseDetailPage({ slug }: { slug: string }) {
  const { user, settings, refreshBootstrap } = useAuth();
  const { addToCart, setCartDrawerOpen, toggleWishlist, wishlist } = useStore();
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-black text-white">
          {error || "دوره مورد نظر یافت نشد"}
        </h1>
        <Link
          href="/courses"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white"
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
  const firstFreeLesson =
    course.chapters.flatMap((c) => c.lessons).find((l) => l.isFree) ??
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
    setCartDrawerOpen(true);
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {activeLesson && (
        <LessonPlayerModal
          courseTitle={course.title}
          chapters={course.chapters}
          activeLesson={activeLesson}
          isEnrolled={Boolean(course.isEnrolled)}
          onSelectLesson={setActiveLesson}
          onClose={() => setActiveLesson(null)}
        />
      )}

      {/* Breadcrumb */}
      <nav
        aria-label="مسیر صفحه"
        className="mb-6 flex items-center gap-2 text-xs text-slate-400"
      >
        <Link href="/" className="hover:text-white">
          خانه
        </Link>
        <span>/</span>
        <Link
          href={`/courses?category=${course.category.slug}`}
          className="hover:text-white"
        >
          {course.category.name}
        </Link>
        <span>/</span>
        <span className="text-slate-200 truncate">{course.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Hero Visual */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
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
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-6">
                {firstFreeLesson && (
                  <button
                    type="button"
                    onClick={() => setActiveLesson(firstFreeLesson)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-white transition-colors"
                  >
                    <PlayCircle className="h-4 w-4 text-indigo-600" />
                    <span>مشاهده پیش‌نمایش دوره</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-indigo-400">
                  {course.category.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className={levelInfo.textClass}>{levelInfo.label}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {toPersianDigits(course.studentsCount)} دانشجو
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {toPersianDigits(course.rating.toFixed(1))}
                </span>
              </div>

              <h1 className="text-2xl font-black leading-snug text-white sm:text-3xl">
                {course.title}
              </h1>

              <p className="text-sm leading-relaxed text-slate-300">
                {course.shortDesc}
              </p>
            </div>
          </div>

          {/* Description */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <h2 className="text-lg font-black text-white">توضیحات جامع دوره</h2>
            <p className="text-sm leading-loose text-slate-300">
              {course.description}
            </p>
          </section>

          {/* Curriculum */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-white">سرفصل‌ها و جلسات دوره</h2>
              <span className="text-xs text-slate-400 tabular-nums">
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
                    className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-right hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-100">
                        {chapter.title}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400 tabular-nums">
                          {toPersianDigits(chapter.lessons.length)} جلسه
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-slate-800/70 border-t border-slate-800">
                        {chapter.lessons.map((lesson) => {
                          const canPlay = lesson.isFree || Boolean(course.isEnrolled);
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between gap-4 px-4 py-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {canPlay ? (
                                  <PlayCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                                )}
                                <span className="text-slate-200 truncate">
                                  {lesson.title}
                                </span>
                                {lesson.isFree && (
                                  <span className="text-[11px] font-bold text-emerald-400 shrink-0">
                                    رایگان
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-slate-400 tabular-nums">
                                  {lesson.duration}
                                </span>
                                {canPlay && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveLesson(lesson)}
                                    className="rounded-lg bg-indigo-600/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                                  >
                                    پخش
                                  </button>
                                )}
                              </div>
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
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 text-lg font-black text-indigo-400">
              {course.instructorName[0]}
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-400">
                مدرس دوره
              </span>
              <h3 className="text-base font-bold text-white">
                {course.instructorName}
              </h3>
              <p className="text-xs text-emerald-400 mt-0.5">
                {course.instructorTitle}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {course.instructorBio}
              </p>
            </div>
          </section>

          {/* Student Reviews */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <h2 className="text-lg font-black text-white">
              دیدگاه دانشجویان ({toPersianDigits(course.reviews.length)})
            </h2>

            {!settings.allowReviews ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                ثبت دیدگاه جدید در حال حاضر توسط مدیریت غیرفعال شده است.
              </div>
            ) : user ? (
              <form
                onSubmit={handleSubmitReview}
                className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="review-comment"
                    className="text-xs font-bold text-slate-200"
                  >
                    تجربه خود را از این دوره بنویسید
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
                              : "text-slate-600"
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
                  placeholder="نظر شما درباره کیفیت تدریس، سرفصل‌ها و پروژه‌ها..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingReview ? "در حال ثبت..." : "ثبت دیدگاه"}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 flex items-center justify-between">
                <span>برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید.</span>
                <Link
                  href={`/auth/login?redirect=/courses/${course.slug}`}
                  className="font-bold text-indigo-400 hover:underline"
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
                course.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {rev.userName}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          {toPersianDigits(rev.rating)}
                        </span>
                        <span>·</span>
                        <span>{formatPersianDate(rev.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sticky Purchase Module */}
        <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">شهریه دوره</span>
            <div className="text-left tabular-nums">
              {discountPercent > 0 && (
                <div className="text-xs text-slate-500 line-through">
                  {formatToman(course.price)}
                </div>
              )}
              <div className="text-2xl font-black text-emerald-400">
                {formatToman(course.discountPrice ?? course.price)}
              </div>
            </div>
          </div>

          {course.isEnrolled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>شما دانشجوی این دوره هستید</span>
              </div>
              {firstFreeLesson && (
                <button
                  type="button"
                  onClick={() => setActiveLesson(firstFreeLesson)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>ثبت‌نام رایگان در دوره</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 py-2.5 text-xs font-semibold text-slate-200 hover:border-rose-500/50 transition-colors"
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

          <dl className="divide-y divide-slate-800/80 border-t border-slate-800 pt-2 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>مدت آموزش</span>
              </dt>
              <dd className="font-bold text-slate-200 tabular-nums">
                {course.duration}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-400">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span>تعداد جلسات</span>
              </dt>
              <dd className="font-bold text-slate-200 tabular-nums">
                {toPersianDigits(totalLessons)} درس
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4 text-slate-500" />
                <span>پیش‌نیاز</span>
              </dt>
              <dd className="font-semibold text-slate-200 text-left max-w-[160px]">
                {course.prerequisites}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-400">
                <Globe className="h-4 w-4 text-slate-500" />
                <span>زبان</span>
              </dt>
              <dd className="font-bold text-slate-200">{course.language}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-slate-400">
                <Award className="h-4 w-4 text-slate-500" />
                <span>گواهینامه</span>
              </dt>
              <dd className="font-bold text-emerald-400">مدرک معتبر پایان دوره</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
