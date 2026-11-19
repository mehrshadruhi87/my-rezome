import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useRouter } from "../../router";
import { useAuth } from "../../context/AuthContext";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import {
  ACCENT_THEME_LIST,
  FONT_SIZE_RANGE,
  MOTION_SPEED_OPTIONS,
} from "../../utils/userPreferences";
import { toPersianDigits } from "../../utils/formatters";
import {
  BookOpen,
  Compass,
  Gauge,
  Home,
  Moon,
  Palette,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  Terminal,
  Trophy,
  Type,
  X,
} from "lucide-react";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export function SettingsDrawer({
  open,
  onClose,
  searchQuery,
  onSearchQueryChange,
}: SettingsDrawerProps) {
  const { user, categories, settings } = useAuth();
  const { push } = useRouter();
  const {
    prefs,
    setMode,
    setAccent,
    setFontSize,
    setMotionSpeed,
    resetPreferences,
    motionDuration,
  } = useUserPreferences();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    onClose();
    push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-start"
          role="dialog"
          aria-modal="true"
          aria-label="منو و مینی تنظیمات زنده"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionDuration(0.2) }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel (Right side in RTL) */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              ease: [0.22, 1, 0.36, 1],
              duration: motionDuration(0.28),
            }}
            className="relative z-10 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-600)] text-white shadow-lg shadow-[var(--accent-500)]/25">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    {settings.brandPrimaryText}
                    <span className="text-[var(--accent-500)] dark:text-[var(--accent-400)]">
                      {settings.brandAccentText}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    منو و مینی تنظیمات زنده
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="بستن منوی تنظیمات"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 p-5">
              {/* Mobile Quick Search */}
              <form onSubmit={handleSearchSubmit} className="md:hidden">
                <div className="relative">
                  <input
                    type="search"
                    aria-label="جستجوی دوره در منو"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="جستجوی دوره یا تکنولوژی..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2.5 pr-9 pl-4 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:border-[var(--accent-500)] focus:outline-none"
                  />
                  <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </form>

              {/* MINI LIVE SETTINGS PANEL */}
              <section
                aria-label="مینی تنظیمات زنده"
                className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-900/70 p-4 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      تنظیمات زنده رابط کاربری
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={resetPreferences}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>پیش‌فرض</span>
                  </button>
                </div>

                {/* 1. Dark / Light Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      حالت نمایش
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {prefs.mode === "dark" ? "تاریک (سایبر)" : "روشن (مینیمال)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-200/70 dark:bg-slate-950/90 p-1">
                    <button
                      type="button"
                      onClick={() => setMode("dark")}
                      aria-pressed={prefs.mode === "dark"}
                      data-testid="theme-mode-dark"
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                        prefs.mode === "dark"
                          ? "bg-[var(--accent-600)] text-white shadow-md shadow-[var(--accent-500)]/30"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      <span>تاریک</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("light")}
                      aria-pressed={prefs.mode === "light"}
                      data-testid="theme-mode-light"
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                        prefs.mode === "light"
                          ? "bg-[var(--accent-600)] text-white shadow-md shadow-[var(--accent-500)]/30"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      <span>روشن</span>
                    </button>
                  </div>
                </div>

                {/* 2. Primary Accent Color */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Palette className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>رنگ اصلی تم</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {ACCENT_THEME_LIST.map((item) => {
                      const active = prefs.accent === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAccent(item.id)}
                          aria-pressed={active}
                          data-testid={`accent-${item.id}`}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-right transition-all ${
                            active
                              ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 text-slate-900 dark:text-white shadow-sm"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-inner"
                              style={{
                                background: `linear-gradient(135deg, ${item.swatch}, ${item.secondarySwatch})`,
                              }}
                            />
                            <div>
                              <div className="text-xs font-bold">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          {active && (
                            <span className="rounded-md bg-[var(--accent-600)] px-2 py-0.5 text-[10px] font-bold text-white">
                              فعال
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Font Size */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="drawer-font-size-slider"
                      className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300"
                    >
                      <Type className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                      <span>اندازه فونت</span>
                    </label>
                    <span
                      data-testid="font-size-value"
                      className="font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] tabular-nums"
                    >
                      {toPersianDigits(prefs.fontSize)} پیکسل
                    </span>
                  </div>
                  <input
                    id="drawer-font-size-slider"
                    type="range"
                    min={FONT_SIZE_RANGE.min}
                    max={FONT_SIZE_RANGE.max}
                    step={1}
                    value={prefs.fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-[var(--accent-500)] cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    {FONT_SIZE_RANGE.presets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFontSize(preset.value)}
                        className={`rounded-lg border py-1.5 text-[11px] font-bold tabular-nums transition-colors ${
                          prefs.fontSize === preset.value
                            ? "border-[var(--accent-500)] bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-300)]"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {preset.label} ({toPersianDigits(preset.value)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Animation Speed */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Gauge className="h-3.5 w-3.5 text-[var(--accent-500)]" />
                    <span>سرعت انیمیشن‌ها</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MOTION_SPEED_OPTIONS.map((opt) => {
                      const active = prefs.motionSpeed === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMotionSpeed(opt.id)}
                          aria-pressed={active}
                          data-testid={`motion-${opt.id}`}
                          className={`rounded-lg border py-1.5 text-[11px] font-bold transition-all ${
                            active
                              ? "border-[var(--accent-500)] bg-[var(--accent-600)] text-white shadow-sm"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Quick Navigation Links */}
              <nav aria-label="ناوبری سریع منو" className="space-y-1.5">
                <div className="px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  دسترسی سریع به بخش‌ها
                </div>
                {[
                  { href: "/", label: "صفحه اصلی", icon: Home },
                  { href: "/courses", label: "کاتالوگ دوره‌ها", icon: BookOpen },
                  {
                    href: "/#roadmaps",
                    label: "نقشه‌های راه تعاملی",
                    icon: Compass,
                  },
                  {
                    href: "/#playground",
                    label: "آزمایشگاه اجرای زنده کد",
                    icon: Terminal,
                  },
                  {
                    href: "/#challenges",
                    label: "چالش‌های روزانه و امتیازدهی",
                    icon: Trophy,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[var(--accent-500)]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>ورود به پنل مدیریت</span>
                  </Link>
                )}
              </nav>

              {/* Categories Quick Chips */}
              {categories.length > 0 && (
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    دپارتمان‌های تخصصی
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/courses?category=${cat.slug}`}
                        onClick={onClose}
                        className="truncate rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
