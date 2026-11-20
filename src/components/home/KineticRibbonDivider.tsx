import React from "react";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { MARQUEE_ITEMS_BY_LANG } from "../../lib/contentLocalization";

function MarqueeTrack({
  keyPrefix,
  items,
  isRtl,
}: {
  keyPrefix: string;
  items: readonly string[];
  isRtl: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-6 pl-6">
      {items.map((label, idx) => (
        <React.Fragment key={`${keyPrefix}-${idx}`}>
          <span
            dir={isRtl ? "rtl" : "ltr"}
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
  const { language, isRtl } = useUserPreferences();
  const items = MARQUEE_ITEMS_BY_LANG[language];

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

      {/* Single-Row Marquee with Horizontal Edge-Fade Mask */}
      <div
        dir="ltr"
        className="kinetic-edge-fade relative z-10 flex w-full overflow-hidden"
      >
        <div className="kinetic-marquee-rtl flex w-max items-center will-change-transform">
          <MarqueeTrack keyPrefix="track-a" items={items} isRtl={isRtl} />
          <MarqueeTrack keyPrefix="track-b" items={items} isRtl={isRtl} />
        </div>
      </div>
    </div>
  );
}
