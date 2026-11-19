import React, { useState } from "react";
import { Link, useRouter } from "../../router";
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
  Unlock,
  Users,
} from "lucide-react";

interface CourseCardProps {
  course: CourseSummary;
}

export function CourseCard({ course }: CourseCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const { enrolledCourseIds } = useAuth();
  const { push } = useRouter();
  const [imgError, setImgError] = useState(false);

  const isWishlisted = wishlist.some((w) => w.id === course.id);
  const isEnrolled =
    Boolean(course.fullAccess) || enrolledCourseIds.includes(course.id);
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
      toast.success("دوره به سبد خرید شما اضافه شد!", {
        action: {
          label: "مشاهده سبد خرید",
          onClick: () => push("/cart"),
        },
      });
    } else {
      toast.info("این دوره قبلاً به سبد خرید شما اضافه شده است.", {
        action: {
          label: "مشاهده سبد خرید",
          onClick: () => push("/cart"),
        },
      });
    }
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
    if (added) toast.success("به لیست علاقه‌مندی‌ها (در صفحه سبد خرید) اضافه شد.");
    else toast.info("از لیست علاقه‌مندی‌ها حذف شد.");
  };

  return (
    <article className="cyber-glow-card group flex flex-col overflow-hidden rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6]/85 dark:bg-slate-900/75 shadow-sm hover:-translate-y-1">
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

        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-slate-950 tabular-nums shadow-sm">
              {toPersianDigits(discountPercent)}٪ تخفیف
            </span>
          )}
          {course.fullAccess && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1 text-[10px] font-black text-slate-950 shadow-sm">
              <Unlock className="h-3 w-3" />
              <span>دسترسی کامل</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          data-testid={`wishlist-toggle-${course.id}`}
          aria-pressed={isWishlisted}
          aria-label={
            isWishlisted
              ? `حذف ${course.title} از علاقه‌مندی‌ها`
              : `افزودن ${course.title} به علاقه‌مندی‌ها`
          }
          className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md transition-all ${
            isWishlisted
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/35"
              : "bg-slate-950/75 text-slate-200 hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-[var(--accent-600)] dark:text-[var(--accent-400)] truncate">
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

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-slate-400">
          {course.shortDesc}
        </p>

        <div className="mt-4 flex items-center justify-between border-b border-slate-300/80 dark:border-slate-800/80 pb-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="truncate max-w-[170px] font-medium text-slate-800 dark:text-slate-300">
            {course.instructorName}
          </span>
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold tabular-nums">
            <span>{toPersianDigits(course.rating.toFixed(1))}</span>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 tabular-nums">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>{toPersianDigits(course.studentsCount)} دانشجو</span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div className="tabular-nums">
            {hasDiscount && (
              <div className="text-[11px] text-slate-500 line-through">
                {formatToman(course.price)}
              </div>
            )}
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
              {formatToman(course.discountPrice ?? course.price)}
            </div>
          </div>

          {isEnrolled ? (
            <Link
              href={`/courses/${course.slug}`}
              className="btn-3d-secondary flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>مشاهده دوره</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-3d flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white whitespace-nowrap shrink-0"
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
