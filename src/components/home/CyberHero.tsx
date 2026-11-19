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
  "مهندسی هوش مصنوعی و LLM",
  "معماری فول‌استک Next.js 15",
  "امنیت سایبری و تست نفوذ وب",
  "طراحی UI/UX با فیگما و وب مدرن",
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
      { num: 2, content: `import { db } from "@/lib/supabase";` },
      { num: 3, content: `export async function enroll(uid: string, slug: string) {` },
      { num: 4, content: `  const course = await db.course.findUnique({ where: { slug } });`, highlight: true },
      { num: 5, content: `  return db.enrollment.create({ data: { uid, id: course.id } });` },
      { num: 6, content: `}` },
    ],
    output: "200 OK · Synced to Supabase (14ms)",
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
      { num: 4, content: `  assertRole(user.role, ["STUDENT", "INSTRUCTOR", "ADMIN"]);` },
      { num: 5, content: `  return { userId: user.sub, verified: true };` },
      { num: 6, content: `}` },
    ],
    output: "HMAC-SHA256 verified · OWASP headers active",
  },
];

const RESTING_TILT = { rotateY: 14, rotateX: -6 };
const HOVER_TILT_MULTIPLIER = 14;

export function CyberHero() {
  const { settings } = useAuth();
  const { push } = useRouter();
  const { prefs, motionDuration, isReducedMotion } = useUserPreferences();

  const [heroQuery, setHeroQuery] = useState("");
  const [activeTabId, setActiveTabId] = useState(CODE_PREVIEW_TABS[0].id);
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState(RESTING_TILT);
  const [isHoveringGroup, setIsHoveringGroup] = useState(false);

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

    let delay = (isDeleting ? 28 : 56) * speedScale;
    if (!isDeleting && typedText === currentPhrase) {
      delay = 3600 * speedScale;
    } else if (isDeleting && typedText.length <= 1) {
      delay = 90 * speedScale;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && typedText === currentPhrase) {
        setIsDeleting(true);
      } else if (isDeleting && typedText.length <= 1) {
        const nextIdx = (phraseIdx + 1) % TYPEWRITER_PHRASES.length;
        setIsDeleting(false);
        setPhraseIdx(nextIdx);
        setTypedText(TYPEWRITER_PHRASES[nextIdx].slice(0, 1));
      } else if (isDeleting) {
        setTypedText(currentPhrase.slice(0, Math.max(1, typedText.length - 1)));
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

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(
      -0.5,
      Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5)
    );
    const y = Math.max(
      -0.5,
      Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5)
    );
    setIsHoveringGroup(true);
    setTilt({
      rotateY: x * HOVER_TILT_MULTIPLIER,
      rotateX: -y * HOVER_TILT_MULTIPLIER,
    });
  };

  const handleStageMouseLeave = () => {
    setIsHoveringGroup(false);
    setTilt(RESTING_TILT);
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-4.25rem)] items-center overflow-hidden border-b border-slate-300/80 dark:border-slate-800/80 py-10 lg:py-14"
    >
      {/* 1. Animated Mesh Gradient Layer */}
      <div
        className="cyber-mesh-bg pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
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
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Right Column (RTL Start): Headline, Gradient Second Line, Search & 3D CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionDuration(0.45),
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-7 text-right"
          >
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              <Code2 className="h-4 w-4 shrink-0" />
              <span>{settings.heroKicker}</span>
            </p>

            <h1
              className="text-3xl font-black leading-[1.2] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.35rem]"
              style={{ textWrap: "balance" }}
            >
              {(() => {
                const title = settings.heroTitle.trim();
                const targetMatch = title.match(
                  /شرکت[\u200c\s]?های تراز اول تجربه کنید/
                );
                let firstPart = "";
                let secondPart = "";

                if (targetMatch && targetMatch.index !== undefined) {
                  firstPart = title.slice(0, targetMatch.index).trim();
                  secondPart = title.slice(targetMatch.index).trim();
                } else {
                  const words = title.split(/\s+/);
                  const splitAt = Math.ceil(words.length / 2);
                  firstPart = words.slice(0, splitAt).join(" ");
                  secondPart = words.slice(splitAt).join(" ");
                }

                return (
                  <>
                    {firstPart && <span className="block">{firstPart}</span>}
                    {secondPart && (
                      <span
                        data-testid="hero-title-accent"
                        className="mt-1 inline-block bg-gradient-to-l from-[var(--accent-700)] via-[var(--accent-600)] to-[var(--accent-500)] dark:from-[var(--accent-300)] dark:via-[rgb(var(--accent-secondary-rgb))] dark:to-[var(--accent-500)] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgb(var(--accent-rgb)/0.28)]"
                      >
                        {secondPart}
                      </span>
                    )}
                  </>
                );
              })()}
            </h1>

            {/* Second Headline Line with Animated Multi-Stop Gradient */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-lg sm:text-2xl font-black">
              <span className="gradient-headline-animated">
                تخصص عملی در:
              </span>
              <span
                data-testid="hero-typewriter"
                className="inline-flex min-h-[2.45rem] min-w-[15rem] sm:min-w-[19.5rem] items-center rounded-xl border border-[var(--accent-500)]/35 bg-[#E2E8F0]/90 dark:bg-slate-900/80 px-4 py-1.5 shadow-sm"
              >
                <span className="gradient-headline-animated">{typedText}</span>
                <span
                  aria-hidden="true"
                  className="cyber-caret mr-1.5 inline-block h-5 w-0.5 bg-[var(--accent-500)]"
                />
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300/90">
              {settings.heroSubtitle}
            </p>

            {/* Primary Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-7 flex max-w-2xl flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-[#E9EFF6]/90 dark:bg-slate-900/80 p-2 shadow-xl shadow-slate-900/5 dark:shadow-black/30 backdrop-blur-xl focus-within:border-[var(--accent-500)] transition-colors"
            >
              <div className="flex flex-1 items-center min-w-0">
                <Search className="mr-3 h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
                <input
                  type="text"
                  aria-label="جستجوی تکنولوژی یا دوره"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="جستجوی دوره یا تکنولوژی (Next.js، فیگما، وردپرس، هوش مصنوعی...)"
                  className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="btn-3d w-full sm:w-auto shrink-0 rounded-xl px-6 py-3 text-xs font-bold text-white whitespace-nowrap"
              >
                جستجوی دوره
              </button>
            </form>

            {/* Tactile 3D Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <Link
                href="/code-lab"
                data-testid="hero-primary-cta"
                className="btn-3d inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold text-white"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>تجربه آزمایشگاه کد زنده</span>
              </Link>
              <Link
                href="/challenges"
                className="btn-3d-secondary inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700/90 bg-[#E2E8F0] dark:bg-slate-900/85 px-5 py-3 text-xs font-bold text-slate-900 dark:text-slate-100 hover:border-[var(--accent-500)] hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-300)]"
              >
                <Trophy className="h-3.5 w-3.5 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
                <span>چالش روزانه و امتیاز</span>
              </Link>
              <Link
                href="/courses"
                className="btn-3d-secondary inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent-500)]/40 bg-[var(--accent-500)]/10 px-4 py-3 text-xs font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)] hover:bg-[var(--accent-500)]/15"
              >
                <span>مشاهده تمام دوره‌ها</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Left Column (RTL End): 3D Perspective Interactive Code Preview Window */}
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
            <div
              data-testid="hero-3d-stage"
              className="code-stage-3d relative"
              onMouseMove={handleStageMouseMove}
              onMouseLeave={handleStageMouseLeave}
            >
              <div
                data-testid="hero-3d-unified-group"
                data-hovering={isHoveringGroup ? "true" : "false"}
                className="code-group-3d relative"
                style={
                  {
                    "--tilt-ry": `${tilt.rotateY.toFixed(2)}deg`,
                    "--tilt-rx": `${tilt.rotateX.toFixed(2)}deg`,
                  } as React.CSSProperties
                }
              >
                {/* Soft Ambient 3D Glow Underneath (Synced to Active Accent) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-tr from-[var(--accent-600)]/30 via-[rgb(var(--accent-secondary-rgb))]/22 to-[var(--accent-400)]/25 blur-2xl opacity-80"
                />

                {/* Primary Glass Code Card */}
                <div
                  data-testid="hero-3d-code-card"
                  className="code-card-3d glass-surface overflow-hidden rounded-3xl border border-slate-300/90 dark:border-white/15"
                >
                {/* Window Bar + File Tabs */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-300/80 dark:border-slate-800/90 bg-[#E2E8F0]/90 dark:bg-slate-950/85 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                    <span
                      dir="ltr"
                      className="mr-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-400"
                    >
                      {activeTab.file}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    aria-label="کپی کد پیش‌نمایش"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
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
                <div className="flex items-center gap-1.5 border-b border-slate-300/70 dark:border-slate-800/70 bg-[#E9EFF6]/80 dark:bg-slate-900/60 px-3 py-2">
                  {CODE_PREVIEW_TABS.map((tab) => {
                    const isActive = tab.id === activeTab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTabId(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                          isActive
                            ? "bg-gradient-to-l from-[var(--accent-500)] to-[var(--accent-600)] text-white shadow-md shadow-[var(--accent-500)]/30"
                            : "text-slate-700 dark:text-slate-400 hover:bg-slate-300/60 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  <span
                    dir="ltr"
                    className="mr-auto hidden sm:inline font-mono text-[10px] text-slate-600 dark:text-slate-400"
                  >
                    {activeTab.runtime}
                  </span>
                </div>

                {/* Code Viewport */}
                <div
                  dir="ltr"
                  className="bg-slate-950/[0.97] p-4 font-mono text-[11px] leading-6 text-slate-200 overflow-x-auto"
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
                <Link
                  href="/code-lab"
                  className="cyber-glow-card glass-surface flex items-center gap-3 rounded-2xl border border-slate-300/90 dark:border-white/10 p-3.5 text-right transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      اجرای زنده کد
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      آزمایشگاه JS و HTML/CSS
                    </div>
                  </div>
                </Link>

                <Link
                  href="/challenges"
                  data-testid="hero-daily-challenge-card"
                  className="cyber-glow-card glass-surface flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300/90 dark:border-white/10 p-3.5 text-right transition-all hover:-translate-y-0.5 hover:border-emerald-500/60 dark:hover:border-emerald-400/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      چالش روزانه
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      به‌روزرسانی روزانه و XP
                    </div>
                  </div>
                </Link>
              </div>
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
                "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
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
              colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              title: "آپدیت مادام‌العمر رایگان",
              desc: "دسترسی دائمی به سرفصل‌های جدید",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="cyber-glow-card glass-surface flex items-center gap-3.5 rounded-2xl border border-slate-300/90 dark:border-white/10 p-4 text-right"
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
