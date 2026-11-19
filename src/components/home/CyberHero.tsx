import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link, useRouter } from "../../router";
import { useAuth } from "../../context/AuthContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { HeroParticleCanvas } from "./HeroParticleCanvas";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Headphones,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Trophy,
} from "lucide-react";

const TYPEWRITER_PHRASES = [
  "معماری فول‌استک Next.js 15",
  "مهندسی هوش مصنوعی و LLM",
  "امنیت سایبری و تست نفوذ وب",
  "طراحی میکروسرویس و کلود",
];

interface CodePreviewTab {
  id: string;
  file: string;
  label: string;
  runtime: string;
  lines: Array<{ num: number; content: string; highlight?: boolean }>;
  output: string;
}

const CODE_PREVIEW_TABS: CodePreviewTab[] = [
  {
    id: "nextjs",
    file: "enroll.action.ts",
    label: "Next.js 15",
    runtime: "TypeScript · Edge",
    lines: [
      { num: 1, content: `"use server";` },
      { num: 2, content: `import { db } from "@/lib/prisma";` },
      { num: 3, content: `export async function enroll(uid: string, slug: string) {` },
      { num: 4, content: `  const course = await db.course.findUnique({ where: { slug } });`, highlight: true },
      { num: 5, content: `  return db.enrollment.create({ data: { uid, id: course.id } });` },
      { num: 6, content: `}` },
    ],
    output: "200 OK · Synced to PostgreSQL (14ms)",
  },
  {
    id: "ai-rag",
    file: "rag.pipeline.ts",
    label: "AI & RAG",
    runtime: "Vector · LLM",
    lines: [
      { num: 1, content: `const vec = await embedQuery(question);` },
      { num: 2, content: `const docs = await vectors.search(vec, { topK: 4 });`, highlight: true },
      { num: 3, content: `const reply = await generateReply({` },
      { num: 4, content: `  context: docs.map((d) => d.chunk).join("\\n"),` },
      { num: 5, content: `  question, citations: true,` },
      { num: 6, content: `});` },
    ],
    output: "4 chunks matched · Faithfulness: 0.98",
  },
  {
    id: "cyber-auth",
    file: "guard.middleware.ts",
    label: "Cyber Auth",
    runtime: "Zero-Trust",
    lines: [
      { num: 1, content: `export function verifySession(req: Request) {` },
      { num: 2, content: `  const token = req.cookies.get("session")?.value;` },
      { num: 3, content: `  const user = verifyJwt(token, env.JWT_SECRET);`, highlight: true },
      { num: 4, content: `  assertRole(user.role, ["STUDENT", "ADMIN"]);` },
      { num: 5, content: `  return { userId: user.sub, verified: true };` },
      { num: 6, content: `}` },
    ],
    output: "HMAC-SHA256 verified · OWASP headers active",
  },
];

const TECH_FILTERS = [
  { label: "Next.js 15", href: "/courses?q=Next.js" },
  { label: "Python و هوش مصنوعی", href: "/courses?category=ai-data" },
  { label: "Node.js و NestJS", href: "/courses?category=backend" },
  { label: "امنیت وب", href: "/courses?category=cybersecurity" },
  { label: "Docker و Kubernetes", href: "/courses?category=devops" },
  { label: "الگوریتم (رایگان)", href: "/courses?price=free" },
];

export function CyberHero() {
  const { settings } = useAuth();
  const { push } = useRouter();
  const { prefs, motionDuration, isReducedMotion } = useUserPreferences();

  const [heroQuery, setHeroQuery] = useState("");
  const [activeTabId, setActiveTabId] = useState(CODE_PREVIEW_TABS[0].id);
  const [copied, setCopied] = useState(false);

  // Typewriter state
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedText, setTypedText] = useState(TYPEWRITER_PHRASES[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isReducedMotion) {
      setTypedText(TYPEWRITER_PHRASES[0]);
      return;
    }

    const currentPhrase = TYPEWRITER_PHRASES[phraseIdx];
    const speedScale =
      prefs.motionSpeed === "fast"
        ? 0.55
        : prefs.motionSpeed === "slow"
          ? 1.55
          : 1;

    let delay = (isDeleting ? 34 : 68) * speedScale;
    if (!isDeleting && typedText === currentPhrase) {
      delay = 2100 * speedScale;
    } else if (isDeleting && typedText === "") {
      delay = 320 * speedScale;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && typedText === currentPhrase) {
        setIsDeleting(true);
      } else if (isDeleting && typedText === "") {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      } else if (isDeleting) {
        setTypedText(currentPhrase.slice(0, Math.max(0, typedText.length - 1)));
      } else {
        setTypedText(currentPhrase.slice(0, typedText.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typedText, isDeleting, phraseIdx, prefs.motionSpeed, isReducedMotion]);

  const activeTab =
    CODE_PREVIEW_TABS.find((t) => t.id === activeTabId) ?? CODE_PREVIEW_TABS[0];

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(
        activeTab.lines.map((l) => l.content).join("\n")
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard restrictions
    }
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-4.25rem)] items-center overflow-hidden border-b border-slate-200 dark:border-slate-800/80 py-10 lg:py-14"
    >
      {/* 1. Animated Mesh Gradient Layer */}
      <div className="cyber-mesh-bg pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="cyber-orb cyber-orb-1" />
        <div className="cyber-orb cyber-orb-2" />
        <div className="cyber-orb cyber-orb-3" />
      </div>

      {/* 2. Subtle Neon Grid Layer */}
      <div
        aria-hidden="true"
        className="cyber-grid pointer-events-none absolute inset-0 opacity-70 dark:opacity-100"
      />

      {/* 3. Interactive Mouse-Reactive Particle Network */}
      <HeroParticleCanvas />

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Right Column (RTL Start): Headline, Typewriter, Search & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionDuration(0.45), ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 text-right"
          >
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              <Code2 className="h-4 w-4 shrink-0" />
              <span>{settings.heroKicker}</span>
            </p>

            <h1
              className="text-3xl font-black leading-[1.2] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.25rem]"
              style={{ textWrap: "balance" }}
            >
              {settings.heroTitle}
            </h1>

            {/* Dynamic Typewriter Row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
              <span className="text-slate-500 dark:text-slate-400">
                تخصص عملی در:
              </span>
              <span
                data-testid="hero-typewriter"
                className="inline-flex min-h-[1.75rem] items-center rounded-lg border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-3 py-0.5 text-[var(--accent-700)] dark:text-[var(--accent-300)]"
              >
                <span>{typedText}</span>
                <span
                  aria-hidden="true"
                  className="cyber-caret mr-1 inline-block h-4 w-0.5 bg-[var(--accent-500)]"
                />
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300/90">
              {settings.heroSubtitle}
            </p>

            {/* Primary Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-7 flex max-w-2xl flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/75 p-2 shadow-xl shadow-slate-900/5 dark:shadow-black/30 backdrop-blur-xl focus-within:border-[var(--accent-500)] transition-colors"
            >
              <div className="flex flex-1 items-center min-w-0">
                <Search className="mr-3 h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  aria-label="جستجوی تکنولوژی یا دوره"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="جستجوی دوره یا تکنولوژی (Next.js، پایتون، امنیت...)"
                  className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="cyber-btn-glow w-full sm:w-auto shrink-0 rounded-xl bg-[var(--accent-600)] px-6 py-3 text-xs font-bold text-white hover:bg-[var(--accent-500)] transition-all whitespace-nowrap"
              >
                جستجوی دوره
              </button>
            </form>

            {/* Interactive Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="#playground"
                className="cyber-btn-glow inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-xs font-bold text-white dark:text-slate-950 hover:opacity-95 transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>تجربه آزمایشگاه کد زنده</span>
              </a>
              <a
                href="#challenges"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700/90 bg-white/75 dark:bg-slate-900/65 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 backdrop-blur-md hover:border-[var(--accent-500)] hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-300)] transition-all"
              >
                <Trophy className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                <span>چالش روزانه و امتیاز</span>
              </a>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:underline underline-offset-4"
              >
                <span>مشاهده تمام دوره‌ها</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            {/* Popular Paths */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                مسیرهای پرطرفدار:
              </span>
              {TECH_FILTERS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 backdrop-blur-md hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Left Column (RTL End): Glassmorphism Interactive Code Preview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: motionDuration(0.55),
              delay: motionDuration(0.08),
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-5"
          >
            <div className="relative">
              {/* Primary Glass Code Card */}
              <div className="cyber-glow-card glass-surface overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl">
                {/* Window Bar + File Tabs */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/90 bg-slate-100/80 dark:bg-slate-950/75 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <span
                      dir="ltr"
                      className="mr-2 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400"
                    >
                      {activeTab.file}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    aria-label="کپی کد پیش‌نمایش"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>کپی</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Snippet Switcher Tabs */}
                <div className="flex items-center gap-1.5 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/50 px-3 py-2">
                  {CODE_PREVIEW_TABS.map((tab) => {
                    const isActive = tab.id === activeTab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTabId(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                          isActive
                            ? "bg-[var(--accent-600)] text-white shadow-md shadow-[var(--accent-500)]/25"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  <span
                    dir="ltr"
                    className="mr-auto hidden sm:inline font-mono text-[10px] text-slate-500 dark:text-slate-400"
                  >
                    {activeTab.runtime}
                  </span>
                </div>

                {/* Code Viewport */}
                <div
                  dir="ltr"
                  className="bg-slate-950/[0.96] p-4 font-mono text-[11px] leading-6 text-slate-200 overflow-x-auto"
                >
                  <pre className="space-y-0.5">
                    {activeTab.lines.map((line) => (
                      <div
                        key={line.num}
                        className={`flex gap-3 rounded-md px-2 py-0.5 ${
                          line.highlight
                            ? "bg-[var(--accent-500)]/15 border-l-2 border-[var(--accent-400)]"
                            : ""
                        }`}
                      >
                        <span className="w-4 select-none text-right text-slate-600 tabular-nums">
                          {line.num}
                        </span>
                        <code className="whitespace-pre text-slate-100">
                          {line.content}
                        </code>
                      </div>
                    ))}
                  </pre>
                </div>

                {/* Output Footer */}
                <div
                  dir="ltr"
                  className="flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-950 px-4 py-2.5 font-mono text-[11px] text-emerald-400"
                >
                  <span className="truncate">{activeTab.output}</span>
                  <span className="shrink-0 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    PASS
                  </span>
                </div>
              </div>

              {/* Secondary Mini Glass Cards Row */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <a
                  href="#playground"
                  className="cyber-glow-card glass-surface flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-white/10 p-3.5 text-right transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      اجرای زنده کد
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      آزمایشگاه آنلاین JS
                    </div>
                  </div>
                </a>

                <a
                  href="#challenges"
                  className="cyber-glow-card glass-surface flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-white/10 p-3.5 text-right transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      چالش روزانه
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      کسب امتیاز XP و رتبه
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 3 Value Guarantees Strip */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionDuration(0.45),
            delay: motionDuration(0.16),
          }}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            {
              icon: ShieldCheck,
              colorClass:
                "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              title: "ضمانت بازگشت وجه",
              desc: "تا ۷ روز بدون قید و شرط",
            },
            {
              icon: Headphones,
              colorClass:
                "bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-400)]",
              title: "پشتیبانی اختصاصی منتور",
              desc: "رفع اشکال کد و بازبینی پروژه",
            },
            {
              icon: RefreshCw,
              colorClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
              title: "آپدیت مادام‌العمر رایگان",
              desc: "دسترسی دائمی به سرفصل‌های جدید",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="cyber-glow-card glass-surface flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/10 p-4 text-right"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.colorClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
