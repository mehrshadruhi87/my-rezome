import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "../router";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { apiRequest } from "../lib/api";
import { CourseCard } from "../components/course/CourseCard";
import { CyberHero } from "../components/home/CyberHero";
import { InteractiveRoadmaps } from "../components/home/InteractiveRoadmaps";
import { LiveCodePlayground } from "../components/home/LiveCodePlayground";
import { DailyChallengesSection } from "../components/home/DailyChallengesSection";
import { toPersianDigits } from "../utils/formatters";
import type { CourseSummary } from "../types";
import { ArrowLeft, Quote, Terminal } from "lucide-react";

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
          setFeaturedCourses(res.courses.slice(0, settings.featuredCoursesLimit));
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
    <div className="space-y-20 pb-20">
      {/* 1. FULL-VIEWPORT CYBER-MINIMAL HERO */}
      <CyberHero />

      {/* 2. FEATURED COURSES */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: motionDuration(0.42) }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              منتخب دانشجویان
            </span>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              دوره‌های ویژه و پرفروش کدآکادمی
            </h2>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:underline underline-offset-4"
          >
            <span>مشاهده تمام دوره‌ها</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-900/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </motion.section>

      {/* 3. CATEGORIES GRID */}
      {settings.showCategoriesSection && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: motionDuration(0.42) }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-8 text-center">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              تخصص خود را انتخاب کنید
            </span>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              دپارتمان‌های تخصصی برنامه‌نویسی
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/courses?category=${cat.slug}`}
                className="cyber-glow-card group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-400)] group-hover:bg-[var(--accent-600)] group-hover:text-white transition-colors">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[var(--accent-600)] dark:group-hover:text-[var(--accent-400)] transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums mr-3">
                  {toPersianDigits(cat.coursesCount ?? 0)} دوره
                </span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* 4. INTERACTIVE LEARNING ROADMAPS */}
      {settings.showRoadmapsSection && <InteractiveRoadmaps />}

      {/* 5. LIVE CODE PLAYGROUND */}
      <LiveCodePlayground />

      {/* 6. DAILY CHALLENGES & SCORING SYSTEM */}
      <DailyChallengesSection />

      {/* 7. STUDENT TESTIMONIALS */}
      {settings.showTestimonialsSection && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: motionDuration(0.42) }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-8 text-center">
            <span className="text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              تجربه دانشجویان
            </span>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              فارغ‌التحصیلان کدآکادمی چه می‌گویند؟
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "محمدرضا کریمی",
                role: "توسعه‌دهنده ارشد فرانت‌اند · دیجی‌کالا",
                text: "بوت‌کمپ Next.js 15 دکتر نادری به معنای واقعی سطح کدنویسی من را به استانداردهای سازمانی رساند و ۳ هفته بعد از اتمام پروژه وارد تیم فنی شدم.",
              },
              {
                name: "مهسا شجاعی",
                role: "مهندس هوش مصنوعی · تیم پردازش زبان",
                text: "برخلاف دوره‌های صرفاً تئوری، در دوره هوش مصنوعی کدآکادمی کار با مدل‌های LLM و پیاده‌سازی RAG روی داده‌های فارسی را کاملاً عملی یاد گرفتم.",
              },
              {
                name: "علی نیک‌پی",
                role: "محقق امنیت وب و باگ هانتر",
                text: "اولین گزارش موفق باگ بانتی خودم را دقیقاً با تکنیک‌های فصل دوم دوره تست نفوذ وب مهندس کاظمی ثبت کردم. بازبینی کد منتورها فوق‌العاده بود.",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="cyber-glow-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-6 relative flex flex-col justify-between"
              >
                <Quote className="h-7 w-7 text-[var(--accent-500)]/20 absolute left-5 top-5" />
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.text}
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-200 dark:border-slate-800/80 pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-500)]/15 font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] text-sm">
                    {item.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {item.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
