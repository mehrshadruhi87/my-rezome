import React from "react";

interface AuthAnimatedBackdropProps {
  spotlightX: number;
  spotlightY: number;
  spotlightActive: boolean;
}

const FLOATING_CODE_TOKENS = [
  { text: "</>", top: "12%", left: "10%", delay: "0s", duration: "19s", size: "text-sm" },
  { text: "{ }", top: "24%", left: "84%", delay: "-4s", duration: "22s", size: "text-base" },
  { text: "=>", top: "74%", left: "12%", delay: "-7s", duration: "20s", size: "text-sm" },
  { text: "async", top: "68%", left: "82%", delay: "-2s", duration: "24s", size: "text-xs" },
  { text: "const", top: "44%", left: "6%", delay: "-9s", duration: "21s", size: "text-xs" },
  { text: "λ()", top: "84%", left: "74%", delay: "-5s", duration: "18s", size: "text-sm" },
  { text: "0x1A", top: "16%", left: "68%", delay: "-11s", duration: "23s", size: "text-xs" },
  { text: "[]", top: "52%", left: "90%", delay: "-3s", duration: "17s", size: "text-sm" },
];

const GEOMETRIC_NODES = [
  { shape: "hex", top: "18%", left: "20%", size: 44, delay: "0s", duration: "26s" },
  { shape: "diamond", top: "76%", left: "22%", size: 32, delay: "-6s", duration: "22s" },
  { shape: "ring", top: "22%", left: "78%", size: 56, delay: "-9s", duration: "28s" },
  { shape: "hex", top: "70%", left: "86%", size: 38, delay: "-3s", duration: "24s" },
  { shape: "diamond", top: "48%", left: "14%", size: 24, delay: "-12s", duration: "20s" },
  { shape: "ring", top: "85%", left: "58%", size: 40, delay: "-5s", duration: "25s" },
];

export function AuthAnimatedBackdrop({
  spotlightX,
  spotlightY,
  spotlightActive,
}: AuthAnimatedBackdropProps) {
  return (
    <div
      data-testid="auth-animated-backdrop"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* 1. Distinct Deep Atmospheric Base (No Ortho Grid) */}
      <div className="auth-atmosphere-base absolute inset-0" />

      {/* 2. Multi-Layered Slow-Drifting Aurora / Nebula Orbs synced to active accent */}
      <div className="auth-aurora-orb auth-aurora-orb-1" />
      <div className="auth-aurora-orb auth-aurora-orb-2" />
      <div className="auth-aurora-orb auth-aurora-orb-3" />

      {/* 3. Sweeping Diagonal Aurora Ribbon */}
      <div className="auth-aurora-ribbon" />

      {/* 4. Subtle Floating Geometric Shapes */}
      {GEOMETRIC_NODES.map((node, index) => (
        <div
          key={`geo-${index}`}
          className="auth-float-particle absolute text-[var(--accent-600)]/20 dark:text-[var(--accent-300)]/20"
          style={{
            top: node.top,
            left: node.left,
            width: node.size,
            height: node.size,
            animationDelay: node.delay,
            animationDuration: `calc(${node.duration} * var(--motion-scale, 1))`,
          }}
        >
          {node.shape === "hex" && (
            <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
              <polygon
                points="32,4 58,18 58,46 32,60 6,46 6,18"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
          {node.shape === "diamond" && (
            <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
              <rect
                x="24"
                y="4"
                width="28"
                height="28"
                rx="4"
                transform="rotate(45 24 4)"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
          {node.shape === "ring" && (
            <svg viewBox="0 0 64 64" fill="none" className="h-full w-full">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeDasharray="6 6"
              />
              <circle
                cx="32"
                cy="32"
                r="14"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.55"
              />
            </svg>
          )}
        </div>
      ))}

      {/* 5. Subtle Floating Code Particles */}
      {FLOATING_CODE_TOKENS.map((token, index) => (
        <span
          key={`tok-${index}`}
          dir="ltr"
          className={`auth-float-particle absolute font-mono font-semibold tracking-wider text-[var(--accent-700)]/25 dark:text-[var(--accent-300)]/22 ${token.size}`}
          style={{
            top: token.top,
            left: token.left,
            animationDelay: token.delay,
            animationDuration: `calc(${token.duration} * var(--motion-scale, 1))`,
          }}
        >
          {token.text}
        </span>
      ))}

      {/* 6. Interactive Radial Spotlight Glow */}
      <div
        data-testid="auth-spotlight"
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: spotlightActive ? 1 : 0.55,
          background: `radial-gradient(540px circle at ${spotlightX}% ${spotlightY}%, rgb(var(--accent-rgb) / 0.2), rgb(var(--accent-secondary-rgb) / 0.09) 38%, transparent 72%)`,
        }}
      />
    </div>
  );
}
