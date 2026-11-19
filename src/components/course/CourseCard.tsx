import React, { useState } from "react";
import { Link } from "../../router";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../context/AuthContext";
import {
  formatToman,
  getLevelInfo,
  toPersianDigits,
} from "../../utils/formatters";
import { calculateDiscountPercent } from "../../utils/pricing";
import {
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../../data/courseAssets";
import type { CourseSummary } from "../../types";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Code2,
  Heart,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";

interface CourseCardProps {
  course: CourseSummary;
}

export function CourseCard({ course }: CourseCardProps) {
  const { addToCart, setCartDrawerOpen, toggleWishlist, wishlist } = useStore();
  const { enrolledCourseIds } = useAuth();
  const [imgError, setImgError] = useState(false);

  const isWishlisted = wishlist.some((w) => w.id === course.id);
  const isEnrolled = enrolledCourseIds.includes(course.id);
  const levelInfo = getLevelInfo(course.level);

  const discountPercent = calculateDiscountPercent(
    course.price,
    course.discountPrice
  );
  const hasDiscount = discountPercent > 0;

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
    if (added) {
      toast.success("دوره به سبد خرید شما اضافه شد!");
    } else {
      toast.info("این دوره قبلاً به سبد خرید شما اضافه شده است.");
    }
    setCartDrawerOpen(true);
  };

  const handleWishlist = () => {
    const added = toggleWishlist({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      instructorName: course.instructorName,
      price: course.price,
      discountPrice: course.discountPrice,
    });
    if (added) toast.success("به لیست علاقه‌مندی‌ها اضافه شد.");
    else toast.info("از لیست علاقه‌مندی‌ها حذف شد.");
  };

  return (
    <article className="cyber-glow-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/75 shadow-sm hover:-translate-y-1">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <Link href={`/courses/${course.slug}`} className="block h-full w-full">
          {!imgError ? (
            <img
              src={resolveCourseThumbnail(course.thumbnail)}
              alt={course.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== DEFAULT_COURSE_THUMBNAIL) {
                  e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                } else {
                  setImgError(true);
                }
              }}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-center">
              <Code2 className="h-8 w-8 text-[var(--accent-400)] mb-2" />
              <span className="text-xs font-semibold text-slate-300 line-clamp-1">
                {course.title}
              </span>
            </div>
          )}
        </Link>

        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-slate-950 tabular-nums">
            {toPersianDigits(discountPercent)}٪ تخفیف
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            isWishlisted
              ? `حذف ${course.title} از علاقه‌مندی‌ها`
              : `افزودن ${course.title} به علاقه‌مندی‌ها`
          }
          className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md transition-colors ${
            isWishlisted
              ? "bg-rose-500 text-white"
              : "bg-slate-950/75 text-slate-300 hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
            {course.category.name}
          </span>
          <span aria-hidden="true">·</span>
          <span className={levelInfo.textClass}>{levelInfo.label}</span>
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="line-clamp-2 text-base font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-600)] dark:group-hover:text-[var(--accent-400)] transition-colors"
        >
          {course.title}
        </Link>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {course.shortDesc}
        </p>

        <div className="mt-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[170px] text-slate-700 dark:text-slate-300">
            {course.instructorName}
          </span>
          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold tabular-nums">
            <span>{toPersianDigits(course.rating.toFixed(1))}</span>
            <Star className="h-3.5 w-3.5 fill-amber-400" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span>{toPersianDigits(course.studentsCount)} دانشجو</span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div className="tabular-nums">
            {hasDiscount && (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 line-through">
                {formatToman(course.price)}
              </div>
            )}
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {formatToman(course.discountPrice ?? course.price)}
            </div>
          </div>

          {isEnrolled ? (
            <Link
              href={`/courses/${course.slug}`}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>مشاهده دوره</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="cyber-btn-glow flex items-center gap-1.5 rounded-xl bg-[var(--accent-600)] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[var(--accent-500)] transition-all whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>ثبت‌نام دوره</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
