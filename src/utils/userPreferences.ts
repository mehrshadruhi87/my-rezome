export type ThemeMode = "dark" | "light";
export type AccentThemeId = "galaxy_blue" | "emerald_green" | "cyber_orange";
export type MotionSpeedId = "off" | "slow" | "normal" | "fast";

export interface UserPreferences {
  mode: ThemeMode;
  accent: AccentThemeId;
  fontSize: number;
  motionSpeed: MotionSpeedId;
}

export interface AccentThemeConfig {
  id: AccentThemeId;
  label: string;
  subtitle: string;
  swatch: string;
  secondarySwatch: string;
  cssVars: {
    "--accent-300": string;
    "--accent-400": string;
    "--accent-500": string;
    "--accent-600": string;
    "--accent-700": string;
    "--accent-rgb": string;
    "--accent-secondary-rgb": string;
    "--color-indigo-300": string;
    "--color-indigo-400": string;
    "--color-indigo-500": string;
    "--color-indigo-600": string;
    "--color-indigo-700": string;
  };
}

export const USER_PREFS_STORAGE_KEY = "codeacademy_user_prefs_v1";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  mode: "dark",
  accent: "galaxy_blue",
  fontSize: 16,
  motionSpeed: "normal",
};

export const ACCENT_THEMES: Record<AccentThemeId, AccentThemeConfig> = {
  galaxy_blue: {
    id: "galaxy_blue",
    label: "آبی کهکشانی",
    subtitle: "نئون آبی و فیروزه‌ای مدرن",
    swatch: "#3b82f6",
    secondarySwatch: "#38bdf8",
    cssVars: {
      "--accent-300": "#93c5fd",
      "--accent-400": "#60a5fa",
      "--accent-500": "#3b82f6",
      "--accent-600": "#2563eb",
      "--accent-700": "#1d4ed8",
      "--accent-rgb": "59 130 246",
      "--accent-secondary-rgb": "56 189 248",
      "--color-indigo-300": "#93c5fd",
      "--color-indigo-400": "#60a5fa",
      "--color-indigo-500": "#3b82f6",
      "--color-indigo-600": "#2563eb",
      "--color-indigo-700": "#1d4ed8",
    },
  },
  emerald_green: {
    id: "emerald_green",
    label: "سبز زمردی",
    subtitle: "ماتریکس زمردی و مینیمال",
    swatch: "#10b981",
    secondarySwatch: "#2dd4bf",
    cssVars: {
      "--accent-300": "#6ee7b7",
      "--accent-400": "#34d399",
      "--accent-500": "#10b981",
      "--accent-600": "#059669",
      "--accent-700": "#047857",
      "--accent-rgb": "16 185 129",
      "--accent-secondary-rgb": "45 212 191",
      "--color-indigo-300": "#6ee7b7",
      "--color-indigo-400": "#34d399",
      "--color-indigo-500": "#10b981",
      "--color-indigo-600": "#059669",
      "--color-indigo-700": "#047857",
    },
  },
  cyber_orange: {
    id: "cyber_orange",
    label: "نارنجی سایبر",
    subtitle: "نارنجی پرانرژی و کهربایی",
    swatch: "#f97316",
    secondarySwatch: "#fbbf24",
    cssVars: {
      "--accent-300": "#fdba74",
      "--accent-400": "#fb923c",
      "--accent-500": "#f97316",
      "--accent-600": "#ea580c",
      "--accent-700": "#c2410c",
      "--accent-rgb": "249 115 22",
      "--accent-secondary-rgb": "251 191 36",
      "--color-indigo-300": "#fdba74",
      "--color-indigo-400": "#fb923c",
      "--color-indigo-500": "#f97316",
      "--color-indigo-600": "#ea580c",
      "--color-indigo-700": "#c2410c",
    },
  },
};

export const ACCENT_THEME_LIST: AccentThemeConfig[] = [
  ACCENT_THEMES.galaxy_blue,
  ACCENT_THEMES.emerald_green,
  ACCENT_THEMES.cyber_orange,
];

export const MOTION_SPEED_OPTIONS: Array<{
  id: MotionSpeedId;
  label: string;
  durationMultiplier: number;
  particleSpeed: number;
}> = [
  { id: "off", label: "خاموش", durationMultiplier: 0, particleSpeed: 0 },
  { id: "slow", label: "آرام", durationMultiplier: 1.65, particleSpeed: 0.45 },
  { id: "normal", label: "عادی", durationMultiplier: 1, particleSpeed: 1 },
  { id: "fast", label: "سریع", durationMultiplier: 0.55, particleSpeed: 1.75 },
];

export const FONT_SIZE_RANGE = {
  min: 14,
  max: 19,
  presets: [
    { label: "کوچک", value: 14 },
    { label: "استاندارد", value: 16 },
    { label: "بزرگ", value: 18 },
  ],
};

export function getMotionConfigValues(speed: MotionSpeedId) {
  return (
    MOTION_SPEED_OPTIONS.find((item) => item.id === speed) ??
    MOTION_SPEED_OPTIONS[2]
  );
}

export function sanitizeUserPreferences(
  input?: Partial<UserPreferences> | null
): UserPreferences {
  const src = input ?? {};
  const mode: ThemeMode = src.mode === "light" ? "light" : "dark";
  const accent: AccentThemeId =
    src.accent && src.accent in ACCENT_THEMES
      ? (src.accent as AccentThemeId)
      : DEFAULT_USER_PREFERENCES.accent;
  const motionSpeed: MotionSpeedId = MOTION_SPEED_OPTIONS.some(
    (item) => item.id === src.motionSpeed
  )
    ? (src.motionSpeed as MotionSpeedId)
    : DEFAULT_USER_PREFERENCES.motionSpeed;

  const parsedSize = Number(src.fontSize);
  const fontSize = Number.isFinite(parsedSize)
    ? Math.min(
        FONT_SIZE_RANGE.max,
        Math.max(FONT_SIZE_RANGE.min, Math.round(parsedSize))
      )
    : DEFAULT_USER_PREFERENCES.fontSize;

  return { mode, accent, fontSize, motionSpeed };
}

export function loadUserPreferences(
  storage?: Pick<Storage, "getItem">
): UserPreferences {
  try {
    const target =
      storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return { ...DEFAULT_USER_PREFERENCES };
    const raw = target.getItem(USER_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_USER_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return sanitizeUserPreferences(parsed);
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function saveUserPreferences(
  prefs: UserPreferences,
  storage?: Pick<Storage, "setItem">
): void {
  try {
    const target =
      storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return;
    target.setItem(
      USER_PREFS_STORAGE_KEY,
      JSON.stringify(sanitizeUserPreferences(prefs))
    );
  } catch {
    // Ignore storage quota / private mode failures
  }
}

export function applyUserPreferencesToDocument(prefs: UserPreferences): void {
  if (typeof document === "undefined") return;
  const normalized = sanitizeUserPreferences(prefs);
  const root = document.documentElement;
  const accentConfig = ACCENT_THEMES[normalized.accent];
  const motionConfig = getMotionConfigValues(normalized.motionSpeed);

  if (normalized.mode === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    root.style.setProperty("--site-bg", "#070b14");
    root.style.setProperty("--site-text", "#f8fafc");
    root.style.setProperty("--color-slate-950", "#030712");
    root.style.setProperty("--color-slate-900", "#0b1120");
    root.style.setProperty("--color-slate-800", "#1e293b");
    root.style.setProperty("--color-slate-700", "#334155");
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    root.style.setProperty("--site-bg", "#f1f5f9");
    root.style.setProperty("--surface-1", "#e9eff6");
    root.style.setProperty("--surface-2", "#e2e8f0");
    root.style.setProperty("--site-text", "#0f172a");
    root.style.removeProperty("--color-slate-950");
    root.style.removeProperty("--color-slate-900");
    root.style.removeProperty("--color-slate-800");
    root.style.removeProperty("--color-slate-700");
  }

  for (const [key, value] of Object.entries(accentConfig.cssVars)) {
    root.style.setProperty(key, value);
  }

  root.style.fontSize = `${normalized.fontSize}px`;
  root.style.setProperty(
    "--motion-scale",
    String(motionConfig.durationMultiplier)
  );
  root.dataset.themeMode = normalized.mode;
  root.dataset.themeAccent = normalized.accent;
  root.dataset.motionSpeed = normalized.motionSpeed;
}
