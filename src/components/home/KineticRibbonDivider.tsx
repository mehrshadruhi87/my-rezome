import React from "react";

const MARQUEE_ITEMS = [
  "برنامه‌نویسی",
  "مدیریت و همکاری",
  "آموزش ۱۰۰٪ پروژه‌محور",
  "آپدیت مادام‌العمر",
  "پشتیبانی اختصاصی منتور",
  "معماری نرم‌افزار در مقیاس واقعی",
  "کدنویسی زنده در مرورگر",
  "مسیرهای استاندارد ورود به بازار کار",
];

function MarqueeTrack({ keyPrefix }: { keyPrefix: string }) {
  return (
    <div className="flex shrink-0 items-center gap-6 pl-6">
      {MARQUEE_ITEMS.map((label, idx) => (
        <React.Fragment key={`${keyPrefix}-${idx}`}>
          <span
            dir="rtl"
            className="shrink-0 whitespace-nowrap text-sm font-medium tracking-tight text-slate-800 dark:text-slate-200/95"
          >
            {label}
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-[11px] leading-none text-[var(--accent-600)] dark:text-[var(--accent-400)] drop-shadow-[0_0_8px_rgb(var(--accent-rgb)/0.75)]"
          >
            ✦
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function KineticRibbonDivider() {
  return (
    <div
      data-testid="kinetic-ribbon-divider"
      aria-hidden="true"
      className="w-full py-2.5 my-4 relative overflow-hidden border-y border-slate-300/75 dark:border-white/10 bg-[#E9EFF6]/60 dark:bg-slate-950/50 select-none pointer-events-none"
    >
      {/* Subtle Centered Ambient Glow (Synced to Active Accent) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 140% at 50% 50%, rgb(var(--accent-rgb) / 0.14) 0%, rgb(var(--accent-secondary-rgb) / 0.08) 45%, transparent 75%)",
        }}
      />

      {/* Single-Row RTL Marquee with Horizontal Edge-Fade Mask */}
      <div
        dir="ltr"
        className="kinetic-edge-fade relative z-10 flex w-full overflow-hidden"
      >
        <div className="kinetic-marquee-rtl flex w-max items-center will-change-transform">
          <MarqueeTrack keyPrefix="track-a" />
          <MarqueeTrack keyPrefix="track-b" />
        </div>
      </div>
    </div>
  );
}
