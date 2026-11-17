import React, { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { CourseCard } from "../components/course/CourseCard";
import { toPersianDigits } from "../utils/formatters";
import type { CourseSummary } from "../types";
import {
  ArrowLeft,
  Cpu,
  Headphones,
  Quote,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
} from "lucide-react";

export function HomePage() {
  const { categories } = useAuth();
  const { push } = useRouter();
  const [featuredCourses, setFeaturedCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroQuery, setHeroQuery] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest<{ courses: CourseSummary[] }>("/api/courses?sort=popular")
      .then((res) => {
        if (active) setFeaturedCourses(res.courses.slice(0, 6));
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
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  };

  const techFilters = [
    { label: "Next.js 15", href: "/courses?q=Next.js" },
    { label: "Python و هوش مصنوعی", href: "/courses?category=ai-data" },
    { label: "Node.js و NestJS", href: "/courses?category=backend" },
    { label: "امنیت وب", href: "/courses?category=cybersecurity" },
    { label: "Docker و Kubernetes", href: "/courses?category=devops" },
    { label: "الگوریتم (رایگان)", href: "/courses?price=free" },
  ];

  const roadmaps = [
    {
      title: "نقشه راه معمار فول‌استک وب",
      steps: [
        "HTML/CSS و TypeScript پیشرفته",
        "React 19 و Next.js 15 App Router",
        "Node.js، Prisma و PostgreSQL",
        "Docker، تست‌نویسی و استقرار CI/CD",
      ],
      duration: "۶ ماه تا استخدام",
      slug: "frontend",
    },
    {
      title: "نقشه راه مهندس هوش مصنوعی و LLM",
      steps: [
        "Python پیشرفته و جبر خطی داده",
        "یادگیری ماشین و PyTorch",
        "معماری Transformer و NLP فارسی",
        "LangChain، RAG و ایجنت‌های سازمانی",
      ],
      duration: "۷ ماه تا استخدام",
      slug: "ai-data",
    },
    {
      title: "نقشه راه متخصص امنیت و باگ بانتی",
      steps: [
        "شبکه، لینوکس و پروتکل HTTP",
        "آسیب‌پذیری‌های OWASP Top 10",
        "تست نفوذ پیشرفته و دور زدن WAF",
        "گزارش‌نویسی حرفه‌ای در HackerOne",
      ],
      duration: "۵ ماه تا کسب درآمد",
      slug: "cybersecurity",
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-800/80 pt-14 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 text-xs font-semibold text-indigo-400">
            ترم جدید بوت‌کمپ‌های تخصصی ۱۴۰۵ · کد تخفیف ۳۰ درصدی: BAHAR30
          </p>

          <h1
            className="mx-auto max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl"
            style={{ textWrap: "balance" }}
          >
            مهندسی نرم‌افزار را در مقیاس{" "}
            <span className="text-indigo-400">شرکت‌های تراز اول</span> تجربه کنید
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-400">
            آموزش عمیق و ۱۰۰٪ پروژه‌محور برنامه‌نویسی، هوش مصنوعی، معماری بک‌اند و امنیت شبکه به همراه منتورشیپ مستقیم و بازبینی کد.
          </p>

          <form
            onSubmit={handleHeroSearch}
            className="mx-auto mt-8 flex max-w-2xl flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 rounded-2xl border border-slate-700/90 bg-slate-900 p-2"
          >
            <div className="flex flex-1 items-center min-w-0">
              <Search className="mr-3 h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                aria-label="جستجوی تکنولوژی یا دوره"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="جستجوی دوره یا تکنولوژی (Next.js، پایتون، امنیت...)"
                className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
            >
              جستجوی دوره
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 ml-1">مسیرهای پرطرفدار:</span>
            {techFilters.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-right">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ضمانت بازگشت وجه</h3>
                <p className="text-xs text-slate-400 mt-0.5">تا ۷ روز بدون قید و شرط</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-right">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">پشتیبانی اختصاصی منتور</h3>
                <p className="text-xs text-slate-400 mt-0.5">رفع اشکال کد و بازبینی پروژه</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-right">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">آپدیت مادام‌العمر رایگان</h3>
                <p className="text-xs text-slate-400 mt-0.5">دسترسی دائمی به سرفصل‌های جدید</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COURSES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-400">منتخب دانشجویان</span>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              دوره‌های ویژه و پرفروش کدآکادمی
            </h2>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
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
                className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse"
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
      </section>

      {/* 3. CATEGORIES GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold text-emerald-400">
            تخصص خود را انتخاب کنید
          </span>
          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            دپارتمان‌های تخصصی برنامه‌نویسی
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?category=${cat.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-indigo-500/50 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Terminal className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-300 tabular-nums mr-3">
                {toPersianDigits(cat.coursesCount ?? 0)} دوره
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. LEARNING ROADMAPS */}
      <section id="roadmaps" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-bold text-indigo-400">
            مسیر استاندارد یادگیری
          </span>
          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            نقشه راه ورود به بازار کار (صفر تا استخدام)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {roadmaps.map((rm, idx) => (
            <div
              key={rm.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {rm.duration}
                  </span>
                  <Cpu className="h-5 w-5 text-slate-500" />
                </div>
                <h3 className="mt-3 text-lg font-black text-white">
                  {toPersianDigits(idx + 1)}. {rm.title}
                </h3>
                <ol className="mt-5 space-y-3">
                  {rm.steps.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-center gap-2.5 text-xs text-slate-300"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/15 text-[11px] font-bold text-indigo-400 tabular-nums">
                        {toPersianDigits(i + 1)}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Link
                href={`/courses?category=${rm.slug}`}
                className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 py-3 text-xs font-bold text-white hover:border-indigo-500 hover:bg-indigo-600 transition-colors"
              >
                <span>مشاهده دوره‌های این مسیر</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. STUDENT TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold text-indigo-400">تجربه دانشجویان</span>
          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
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
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 relative flex flex-col justify-between"
            >
              <Quote className="h-7 w-7 text-indigo-500/20 absolute left-5 top-5" />
              <p className="text-xs leading-relaxed text-slate-300">
                {item.text}
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-800/80 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 font-bold text-indigo-400 text-sm">
                  {item.name[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{item.name}</div>
                  <div className="text-[11px] text-emerald-400">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
