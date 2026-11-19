import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "../router";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { apiRequest } from "../lib/api";
import { CourseCard } from "../components/course/CourseCard";
import { CyberHero } from "../components/home/CyberHero";
import { KineticRibbonDivider } from "../components/home/KineticRibbonDivider";
import { InteractiveRoadmaps } from "../components/home/InteractiveRoadmaps";
import { LiveCodePlayground } from "../components/home/LiveCodePlayground";
import { DailyChallengesSection } from "../components/home/DailyChallengesSection";
import { NewsSection } from "../components/home/NewsSection";
import { toPersianDigits } from "../utils/formatters";
import type { CourseSummary } from "../types";
import {
  ArrowLeft,
  BrainCircuit,
  CloudCog,
  Clock,
  Globe,
  GraduationCap,
  Layout,
  Palette,
  Quote,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout,
  Server,
  BrainCircuit,
  ShieldCheck,
  Smartphone,
  CloudCog,
  Palette,
  Globe,
  Terminal,
};

function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10"
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-800 to-transparent" />
    </div>
  );
}

export function HomePage() {
  const { categories, settings } = useAuth();
  const { motionDuration } = useUserPreferences();
  const [featuredCourses, setFeaturedCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest<{ courses: CourseSummary[] }>("/api/courses?sort=newest")
      .then((res) => {
        if (active) {
          const prioritized = [
            ...res.courses.filter((c) => c.isFeatured),
            ...res.courses.filter((c) => !c.isFeatured),
          ];
          setFeaturedCourses(
            prioritized.slice(0, Math.max(6, settings.featuredCoursesLimit))
          );
        }
      })
      .catch(() => {
        if (active) setFeaturedCourses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [settings.featuredCoursesLimit]);

  return (
    <div className="pb-24">
      {/* 1. FULL-VIEWPORT CYBER-MINIMAL HERO */}
      <CyberHero />

      {/* 2. FEATURED COURSES (2x3 Grid + Bottom View All Courses CTA) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: motionDuration(0.42) }}
        className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-10"
      >
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>منتخب دانشجویان و مهندسان</span>
            </span>
            <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              دوره‌های ویژه و پرفروش کدآکادمی
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              ۶ بوت‌کمپ و دوره کلیدی با پروژه‌های واقعی، پشتیبانی فنی و گواهینامه معتبر
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:underline underline-offset-4"
          >
            <span>فیلتر و جستجو در کل کاتالوگ</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-96 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.slice(0, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Prominent Bottom CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/courses"
            className="btn-3d inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-black"
          >
            <span>مشاهده همه دوره‌ها</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <KineticRibbonDivider />

      {/* 3. SPECIALIZED DEPARTMENTS (Generous Separation) */}
      {settings.showCategoriesSection && (
        <>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: motionDuration(0.42) }}
            className="mx-auto max-w-[1400px] px-4 py-20 my-4 sm:px-6 lg:px-10"
          >
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                تخصص خود را هوشمندانه انتخاب کنید
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                دپارتمان‌های تخصصی برنامه‌نویسی
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                از فرانت‌اند، بک‌اند و هوش مصنوعی تا طراحی رابط کاربری فیگما و وردپرس — مسیرهای دسته‌بندی‌شده با مدیریت زنده
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => {
                const IconComp = CATEGORY_ICON_MAP[cat.icon] || Terminal;
                return (
                  <Link
                    key={cat.id}
                    href={`/courses?category=${cat.slug}`}
                    className="cyber-glow-card group flex flex-col justify-between gap-4 rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 p-5 hover:-translate-y-1 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-700)] dark:text-[var(--accent-400)] group-hover:bg-[var(--accent-600)] group-hover:text-white transition-colors">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <span className="rounded-lg border border-slate-300/80 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {toPersianDigits(cat.coursesCount ?? 0)} دوره
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[var(--accent-700)] dark:group-hover:text-[var(--accent-400)] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>

          <SectionDivider />
        </>
      )}

      {/* 4. INTERACTIVE LEARNING ROADMAPS */}
      {settings.showRoadmapsSection && (
        <div className="py-16 my-4">
          <InteractiveRoadmaps />
        </div>
      )}

      <SectionDivider />

      {/* 5. LIVE CODE PLAYGROUND */}
      <div className="py-16 my-4">
        <LiveCodePlayground />
      </div>

      <SectionDivider />

      {/* 6. DAILY CHALLENGES & SCORING SYSTEM */}
      <div className="py-16 my-4">
        <DailyChallengesSection />
      </div>

      <SectionDivider />

      {/* 7. PROGRAMMING NEWS SECTION */}
      <div className="py-16 my-4">
        <NewsSection compact />
      </div>

      <SectionDivider />

      {/* 8. GRADUATES & ALUMNI (Minimal: Mehrshad Ruhi + Coming Soon) */}
      {settings.showTestimonialsSection && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: motionDuration(0.42) }}
          className="mx-auto max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10"
        >
          <div className="mb-10 text-center max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              <GraduationCap className="h-4 w-4" />
              <span>تجربه واقعی دانشجویان و فارغ‌التحصیلان</span>
            </span>
            <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              فارغ‌التحصیلان کدآکادمی
            </h2>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {/* Single Featured Graduate Card: Mehrshad Ruhi */}
            <div className="cyber-glow-card relative flex flex-col justify-between rounded-2xl border border-[var(--accent-500)]/40 bg-[#E9EFF6] dark:bg-slate-900/80 p-7 shadow-lg">
              <Quote className="h-8 w-8 text-[var(--accent-500)]/25 absolute left-6 top-6" />
              <div className="space-y-3">
                <span className="inline-block rounded-lg bg-[var(--accent-500)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                  دانشجو و فارغ‌التحصیل کدآکادمی
                </span>
                <p className="text-sm leading-loose text-slate-700 dark:text-slate-200">
                  مسیر یادگیری پروژه‌محور، آزمایشگاه کدنویسی زنده و چالش‌های روزانه کدآکادمی کمک کرد مفاهیم مهندسی نرم‌افزار و توسعه وب مدرن را از پایه تا اجرای پروژه‌های عملی با تسلط بالا یاد بگیرم و نمونه‌کار حرفه‌ای خودم را بسازم.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3.5 border-t border-slate-300/80 dark:border-slate-800 pt-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-600)] text-base font-black text-white shadow-md">
                  م
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    مهرشاد روحی
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    دانشجو و فارغ‌التحصیل دوره‌های تخصصی کدآکادمی
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Coming Soon Slot */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-[#E2E8F0]/60 dark:bg-slate-900/40 p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-[#E9EFF6] dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                به‌زودی...
              </h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                پروفایل و داستان موفقیت سایر فارغ‌التحصیلان و دانشجویان برتر کدآکادمی به‌زودی در این بخش منتشر خواهد شد.
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
