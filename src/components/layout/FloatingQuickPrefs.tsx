import React from "react";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { Moon, Sun } from "lucide-react";

export function FloatingQuickPrefs() {
  const { prefs, language, setLanguage, toggleMode } = useUserPreferences();
  const isDark = prefs.mode === "dark";

  return (
    <div
      dir="ltr"
      data-testid="floating-quick-prefs"
      role="region"
      aria-label={language === "en" ? "Quick display preferences" : "تنظیمات سریع نمایش"}
      className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 z-40 flex items-center gap-2.5 rounded-full border border-slate-300/80 dark:border-white/15 bg-white/85 dark:bg-slate-900/75 px-3 py-1.5 shadow-lg shadow-slate-900/10 dark:shadow-black/50 backdrop-blur-xl transition-colors"
    >
      {/* Text-only Language Toggle (FA | EN) */}
      <div
        role="group"
        aria-label={language === "en" ? "Language switcher" : "تغییر زبان"}
        className="flex items-center gap-1"
      >
        <button
          type="button"
          data-testid="quick-lang-fa"
          aria-pressed={language === "fa"}
          onClick={() => setLanguage("fa")}
          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-wide transition-all ${
            language === "fa"
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          FA
        </button>
        <span
          aria-hidden="true"
          className="text-[10px] text-slate-400 dark:text-slate-600 select-none"
        >
          |
        </span>
        <button
          type="button"
          data-testid="quick-lang-en"
          aria-pressed={language === "en"}
          onClick={() => setLanguage("en")}
          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold tracking-wide transition-all ${
            language === "en"
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          EN
        </button>
      </div>

      {/* Divider */}
      <span
        aria-hidden="true"
        className="h-3.5 w-px bg-slate-300 dark:bg-white/15"
      />

      {/* Icon-Only Theme Toggle (Sun / Moon) */}
      <button
        type="button"
        data-testid="quick-theme-toggle"
        onClick={toggleMode}
        aria-label={
          isDark
            ? language === "en"
              ? "Switch to Light Mode"
              : "تغییر به حالت روشن"
            : language === "en"
              ? "Switch to Dark Mode"
              : "تغییر به حالت تاریک"
        }
        title={isDark ? "Light Mode" : "Dark Mode"}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
