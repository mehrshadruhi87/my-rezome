import React, { useCallback, useEffect, useState } from "react";
import { Link } from "../router";
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
import { CyberHero } from "../components/home/CyberHero";
import { KineticRibbonDivider } from "../components/home/KineticRibbonDivider";
import { InteractiveRoadmaps } from "../components/home/InteractiveRoadmaps";
import { LiveCodePlayground } from "../components/home/LiveCodePlayground";
import { DailyChallengesSection } from "../components/home/DailyChallengesSection";
import { NewsSection } from "../components/home/NewsSection";
import { formatDigits } from "../utils/formatters";
import type { CourseSummary } from "../types";
import {
  ArrowLeft,
  ArrowRight,
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

const CATEGORY_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
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
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 dark:via-emerald-500/20 to-transparent" />
    </div>
  );
}

export function HomePage() {
  const { categories, settings } = useAuth();
  const { language, isRtl } = useUserPreferences();
  const t = getDictionary(language);
  const DirArrow = isRtl ? ArrowLeft : ArrowRight;
  const [featuredCourses, setFeaturedCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeaturedCourses = useCallback(async () => {
    try {
      const res = await apiRequest<{ courses: CourseSummary[] }>(
        "/api/courses?sort=newest"
      );
      const prioritized = [
        ...res.courses.filter((c) => c.isFeatured),
        ...res.courses.filter((c) => !c.isFeatured),
      ];
      setFeaturedCourses(
        prioritized.slice(0, Math.max(6, settings.featuredCoursesLimit))
      );
    } catch {
      setFeaturedCourses([]);
    } finally {
      setLoading(false);
    }
  }, [settings.featuredCoursesLimit]);

  useEffect(() => {
    void loadFeaturedCourses();
  }, [loadFeaturedCourses]);

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<RealtimeSyncEventDetail>).detail;
      if (
        !detail ||
        detail.table === "courses" ||
        detail.table === "course_reviews" ||
        detail.table === "categories"
      ) {
        void loadFeaturedCourses();
      }
    };
    window.addEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    return () => {
      window.removeEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    };
  }, [loadFeaturedCourses]);

  const quickJumpLinks = [
    { href: "#featured-courses", label: t.quickJump.featured },
    { href: "#departments", label: t.quickJump.departments },
    { href: "#roadmaps", label: t.quickJump.roadmaps },
    { href: "#playground", label: t.quickJump.playground },
    { href: "#challenges", label: t.quickJump.challenges },
    { href: "#tech-news", label: t.quickJump.news },
  ];

  return (
    <div>
      {/* 1. FULL-VIEWPORT CYBER-MINIMAL HERO (Extended behind transparent Header) */}
      <CyberHero />

      {/* LOWER SECTIONS WRAPPER WITH SUBTLE EMERALD CYBER-GRID */}
      <div
        data-testid="lower-emerald-sections"
        className="lower-emerald-cyber-bg pb-16 md:pb-24"
      >
        {/* Sticky Mobile Quick-Jump Pill Bar (< 768px) */}
        <nav
          data-testid="mobile-quick-jump-bar"
          aria-label={language === "en" ? "Quick section jump" : "دسترسی سریع بخش‌ها"}
          className="md:hidden sticky top-[56px] z-30 border-y border-slate-300/60 dark:border-white/10 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl px-3 py-2"
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {quickJumpLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-full border border-slate-300/80 dark:border-white/15 bg-slate-100/90 dark:bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:border-[var(--accent-500)] hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* 2. FEATURED COURSES (Mobile Horizontal Carousel + Desktop 2x3 Grid) */}
        <section
          id="featured-courses"
          className="scroll-mt-24 mx-auto max-w-[1400px] px-4 py-8 md:py-16 sm:px-6 lg:px-10"
        >
          <div className="mb-7 md:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.home.featuredKicker}</span>
              </span>
              <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                {t.home.featuredTitle}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t.home.featuredSub}
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:underline underline-offset-4"
            >
              <span>{t.home.filterCatalog}</span>
              <DirArrow className="h-4 w-4" />
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
            <div
              data-testid="featured-courses-track"
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 -mx-4 px-4 no-scrollbar md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-7"
            >
              {featuredCourses.slice(0, 6).map((course) => (
                <div
                  key={course.id}
                  className="w-[84vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink"
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}

          {/* Prominent Bottom CTA */}
          <div className="mt-9 md:mt-12 flex justify-center">
            <Link
              href="/courses"
              className="btn-3d inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-black"
            >
              <span>{t.home.viewAllCourses}</span>
              <DirArrow className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <KineticRibbonDivider />

        {/* 3. SPECIALIZED DEPARTMENTS */}
        {settings.showCategoriesSection && (
          <>
            <section
              id="departments"
              className="scroll-mt-24 mx-auto max-w-[1400px] px-4 py-10 md:py-20 my-2 md:my-4 sm:px-6 lg:px-10"
            >
              <div className="mb-8 md:mb-10 text-center max-w-2xl mx-auto">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {t.home.departmentsKicker}
                </span>
                <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  {t.home.departmentsTitle}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {t.home.departmentsSub}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat) => {
                  const localizedCat = localizeCategory(cat, language);
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
                          {formatDigits(cat.coursesCount ?? 0, language)}{" "}
                          {t.home.coursesCountUnit}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[var(--accent-700)] dark:group-hover:text-[var(--accent-400)] transition-colors">
                          {localizedCat.name}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                          {localizedCat.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <SectionDivider />
          </>
        )}

        {/* 4. INTERACTIVE LEARNING ROADMAPS */}
        {settings.showRoadmapsSection && (
          <div className="py-10 md:py-16 my-2 md:my-4">
            <InteractiveRoadmaps />
          </div>
        )}

        <SectionDivider />

        {/* 5. LIVE CODE PLAYGROUND */}
        <div className="py-10 md:py-16 my-2 md:my-4">
          <LiveCodePlayground />
        </div>

        <SectionDivider />

        {/* 6. DAILY CHALLENGES & SCORING SYSTEM */}
        <div className="py-10 md:py-16 my-2 md:my-4">
          <DailyChallengesSection />
        </div>

        <SectionDivider />

        {/* 7. PROGRAMMING NEWS SECTION */}
        <div className="py-10 md:py-16 my-2 md:my-4">
          <NewsSection compact />
        </div>

        <SectionDivider />

        {/* 8. GRADUATES & ALUMNI (Minimal: Mehrshad Ruhi + Coming Soon) */}
        {settings.showTestimonialsSection && (
          <section className="mx-auto max-w-[1400px] px-4 pt-10 md:pt-16 sm:px-6 lg:px-10">
            <div className="mb-8 md:mb-10 text-center max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                <GraduationCap className="h-4 w-4" />
                <span>{t.home.alumniKicker}</span>
              </span>
              <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                {t.home.alumniTitle}
              </h2>
            </div>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              {/* Single Featured Graduate Card: Mehrshad Ruhi */}
              <div className="cyber-glow-card relative flex flex-col justify-between rounded-2xl border border-[var(--accent-500)]/40 bg-[#E9EFF6] dark:bg-slate-900/80 p-7 shadow-lg">
                <Quote
                  className={`h-8 w-8 text-[var(--accent-500)]/25 absolute ${
                    isRtl ? "left-6" : "right-6"
                  } top-6`}
                />
                <div className="space-y-3">
                  <span className="inline-block rounded-lg bg-[var(--accent-500)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                    {t.home.alumniBadge}
                  </span>
                  <p className="text-sm leading-loose text-slate-700 dark:text-slate-200">
                    {t.home.alumniQuote}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3.5 border-t border-slate-300/80 dark:border-slate-800 pt-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-600)] text-base font-black text-white shadow-md">
                    {language === "en" ? "M" : "م"}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {t.home.alumniName}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {t.home.alumniRole}
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
                  {t.home.comingSoonTitle}
                </h3>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.home.comingSoonDesc}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
