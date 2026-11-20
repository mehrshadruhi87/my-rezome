import React from "react";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { Moon, Sun } from "lucide-react";

export function FloatingPreferencesPill() {
  const { prefs, language, setLanguage, setMode } = useUserPreferences();
  const isDark = prefs.mode === "dark";

  return (
    <div
      dir="ltr"
      data-testid="floating-preferences-pill"
      role="group"
      aria-label={
        language === "en" ? "Language and theme preferences" : "تنظیمات زبان و تم"
      }
      className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-40 flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-slate-300/80 dark:border-white/15 bg-white/85 dark:bg-slate-900/75 px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg shadow-slate-900/15 dark:shadow-black/50 backdrop-blur-xl transition-colors"
    >
      {/* Text-only FA | EN Language Toggle */}
      <div className="flex items-center gap-1 text-[11px] font-black tracking-wide">
        <button
          type="button"
          onClick={() => setLanguage("fa")}
          data-testid="floating-lang-fa"
          aria-pressed={language === "fa"}
          aria-label="فارسی"
          className={`rounded-full px-2 py-0.5 transition-colors ${
            language === "fa"
              ? "bg-[var(--accent-600)] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          FA
        </button>
        <span
          aria-hidden="true"
          className="text-slate-300 dark:text-white/20 select-none"
        >
          |
        </span>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          data-testid="floating-lang-en"
          aria-pressed={language === "en"}
          aria-label="English"
          className={`rounded-full px-2 py-0.5 transition-colors ${
            language === "en"
              ? "bg-[var(--accent-600)] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          EN
        </button>
      </div>

      <span
        aria-hidden="true"
        className="h-4 w-px bg-slate-300/90 dark:bg-white/15"
      />

      {/* Icon-only Theme Toggle (Sun / Moon) */}
      <button
        type="button"
        onClick={() => setMode(isDark ? "light" : "dark")}
        data-testid="floating-theme-toggle"
        aria-label={
          isDark
            ? language === "en"
              ? "Switch to Light Mode"
              : "تغییر به حالت روشن"
            : language === "en"
              ? "Switch to Dark Mode"
              : "تغییر به حالت تاریک"
        }
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 dark:text-amber-300 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
