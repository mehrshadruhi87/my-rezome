import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Code2, Users } from "lucide-react";

const TICKER_ITEMS = [
  {
    id: "programming",
    label: "برنامه‌نویسی",
    subtitle: "معماری وب، هوش مصنوعی، امنیت و کلود",
    icon: Code2,
  },
  {
    id: "management",
    label: "مدیریت و همکاری",
    subtitle: "کار تیمی، گیت‌فلو، رهبری فنی و اسکرام",
    icon: Users,
  },
];

export function FloatingMidTicker() {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 3400);
    return () => window.clearInterval(interval);
  }, []);

  const current = TICKER_ITEMS[activeIndex];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="floating-mid-ticker"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.28 }}
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 pointer-events-auto"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-slate-300/90 dark:border-slate-700/80 bg-[#E9EFF6]/95 dark:bg-slate-900/90 px-4 py-2 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              {TICKER_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                    idx === activeIndex
                      ? "bg-[var(--accent-600)] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline-block h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 min-w-[215px]">
              <Icon className="h-3.5 w-3.5 text-[var(--accent-600)] dark:text-[var(--accent-400)] shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={current.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="truncate font-medium"
                >
                  {current.subtitle}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
