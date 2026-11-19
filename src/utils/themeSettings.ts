import type {
  PlatformSettings,
  RadiusPresetId,
  SiteFontId,
  ThemePaletteId,
} from "../types";

export interface ThemePaletteDefinition {
  id: ThemePaletteId;
  name: string;
  description: string;
  swatches: [string, string, string, string, string];
  cssVars: {
    "--site-bg": string;
    "--color-slate-950": string;
    "--color-slate-900": string;
    "--color-slate-800": string;
    "--color-slate-700": string;
    "--color-indigo-300": string;
    "--color-indigo-400": string;
    "--color-indigo-500": string;
    "--color-indigo-600": string;
    "--color-indigo-700": string;
  };
}

export const THEME_PALETTES: ThemePaletteDefinition[] = [
  {
    id: "indigo_slate",
    name: "نیلی کلاسیک (پیش‌فرض)",
    description: "سرمه‌ای عمیق با رنگ اصلی نیلی مهندسی",
    swatches: ["#0f172a", "#1e293b", "#4f46e5", "#818cf8", "#10b981"],
    cssVars: {
      "--site-bg": "#0f172a",
      "--color-slate-950": "#020617",
      "--color-slate-900": "#0f172a",
      "--color-slate-800": "#1e293b",
      "--color-slate-700": "#334155",
      "--color-indigo-300": "#a5b4fc",
      "--color-indigo-400": "#818cf8",
      "--color-indigo-500": "#6366f1",
      "--color-indigo-600": "#4f46e5",
      "--color-indigo-700": "#4338ca",
    },
  },
  {
    id: "emerald_obsidian",
    name: "زمردی ابسیدین",
    description: "مشکی مایل به سبز با تاکید زمردی پرانرژی",
    swatches: ["#071311", "#0b1c19", "#059669", "#34d399", "#14b8a6"],
    cssVars: {
      "--site-bg": "#071311",
      "--color-slate-950": "#040c0a",
      "--color-slate-900": "#0b1c19",
      "--color-slate-800": "#132d28",
      "--color-slate-700": "#1e423b",
      "--color-indigo-300": "#6ee7b7",
      "--color-indigo-400": "#34d399",
      "--color-indigo-500": "#10b981",
      "--color-indigo-600": "#059669",
      "--color-indigo-700": "#047857",
    },
  },
  {
    id: "cyan_ocean",
    name: "اقیانوسی فیروزه‌ای",
    description: "آبی تیره عمیق با دکمه‌های فیروزه‌ای شفاف",
    swatches: ["#08121a", "#0d1b26", "#0891b2", "#22d3ee", "#38bdf8"],
    cssVars: {
      "--site-bg": "#08121a",
      "--color-slate-950": "#040a0f",
      "--color-slate-900": "#0d1b26",
      "--color-slate-800": "#162b3d",
      "--color-slate-700": "#213d54",
      "--color-indigo-300": "#67e8f9",
      "--color-indigo-400": "#22d3ee",
      "--color-indigo-500": "#06b6d4",
      "--color-indigo-600": "#0891b2",
      "--color-indigo-700": "#0e7490",
    },
  },
  {
    id: "amber_carbon",
    name: "کربنی کهربایی",
    description: "کربنی گرم استودیویی با کنتراست طلایی و نارنجی",
    swatches: ["#12100e", "#1b1714", "#b45309", "#fbbf24", "#f59e0b"],
    cssVars: {
      "--site-bg": "#12100e",
      "--color-slate-950": "#090807",
      "--color-slate-900": "#1b1714",
      "--color-slate-800": "#2b241e",
      "--color-slate-700": "#3d332a",
      "--color-indigo-300": "#fde68a",
      "--color-indigo-400": "#fbbf24",
      "--color-indigo-500": "#d97706",
      "--color-indigo-600": "#b45309",
      "--color-indigo-700": "#92400e",
    },
  },
  {
    id: "rose_midnight",
    name: "یاقوتی نیمه‌شب",
    description: "بستر تاریک آلبالویی با تاکید سرخ و یاقوتی مدرن",
    swatches: ["#140b12", "#1e111b", "#e11d48", "#fb7185", "#f43f5e"],
    cssVars: {
      "--site-bg": "#140b12",
      "--color-slate-950": "#0a0509",
      "--color-slate-900": "#1e111b",
      "--color-slate-800": "#2f1a2a",
      "--color-slate-700": "#44263d",
      "--color-indigo-300": "#fda4af",
      "--color-indigo-400": "#fb7185",
      "--color-indigo-500": "#f43f5e",
      "--color-indigo-600": "#e11d48",
      "--color-indigo-700": "#be123c",
    },
  },
];

export interface SiteFontDefinition {
  id: SiteFontId;
  name: string;
  description: string;
  cssFamily: string;
}

export const SITE_FONTS: SiteFontDefinition[] = [
  {
    id: "vazirmatn",
    name: "وزیرمتن (Vazirmatn)",
    description: "خوانا، مدرن و استاندارد برای رابط کاربری فارسی",
    cssFamily: '"Vazirmatn", system-ui, -apple-system, sans-serif',
  },
  {
    id: "rubik",
    name: "روبیک (Rubik)",
    description: "هندسی با گوشه‌های نرم و ظاهر استارتاپی",
    cssFamily: '"Rubik", "Vazirmatn", system-ui, sans-serif',
  },
  {
    id: "readex_pro",
    name: "ریدکس پرو (Readex Pro)",
    description: "تایپوگرافی دقیق فنی مناسب پلتفرم‌های مهندسی",
    cssFamily: '"Readex Pro", "Vazirmatn", system-ui, sans-serif',
  },
  {
    id: "noto_sans_arabic",
    name: "نوتو سنس (Noto Sans Arabic)",
    description: "متوازن و رسمی مناسب متون آموزشی و سازمانی",
    cssFamily: '"Noto Sans Arabic", "Vazirmatn", system-ui, sans-serif',
  },
  {
    id: "noto_naskh_arabic",
    name: "نوتو نسخ (Noto Naskh)",
    description: "سبک کتابی و کلاسیک با خوانایی بالا در مقالات",
    cssFamily: '"Noto Naskh Arabic", "Vazirmatn", Georgia, serif',
  },
];

export const RADIUS_PRESETS: Record<
  RadiusPresetId,
  { label: string; lg: string; xl: string; "2xl": string }
> = {
  sharp: {
    label: "تیز و صنعتی",
    lg: "0.25rem",
    xl: "0.375rem",
    "2xl": "0.5rem",
  },
  default: {
    label: "متعادل (پیش‌فرض)",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
  },
  rounded: {
    label: "نرم و گرد",
    lg: "0.75rem",
    xl: "1.125rem",
    "2xl": "1.5rem",
  },
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  themePalette: "indigo_slate",
  fontFamily: "vazirmatn",
  baseFontSize: 16,
  headingScale: 1,
  lineHeight: 1.65,
  borderRadius: "default",

  brandPrimaryText: "کد",
  brandAccentText: "آکادمی",
  siteTitle: "کدآکادمی | پلتفرم جامع آموزش برنامه‌نویسی و بوت‌کمپ‌های تخصصی",
  footerTagline:
    "کدآکادمی، مرجع تخصصی بوت‌کمپ‌ها و دوره‌های مهندسی نرم‌افزار، هوش مصنوعی، امنیت شبکه و کلود با منتورشیپ مستقیم متخصصین ارشد صنعت.",
  copyrightText:
    "© ۱۴۰۵ تمامی حقوق مادی و معنوی برای پلتفرم آموزشی کدآکادمی محفوظ است.",

  heroKicker: "ترم جدید بوت‌کمپ‌های تخصصی ۱۴۰۵ · کد تخفیف ۳۰ درصدی: BAHAR30",
  heroTitle: "مهندسی نرم‌افزار را در مقیاس شرکت‌های تراز اول تجربه کنید",
  heroSubtitle:
    "آموزش عمیق و ۱۰۰٪ پروژه‌محور برنامه‌نویسی، هوش مصنوعی، معماری بک‌اند و امنیت شبکه به همراه منتورشیپ مستقیم و بازبینی کد.",
  featuredCoursesLimit: 9,

  showAnnouncementBar: false,
  announcementText:
    "جشنواره بهاری کدآکادمی: ۳۰٪ تخفیف روی تمام بوت‌کمپ‌ها با کد BAHAR30",
  announcementLink: "/courses",

  showCategoriesSection: true,
  showRoadmapsSection: true,
  showTestimonialsSection: true,
  showTrustBadges: true,

  allowRegistration: true,
  allowCoupons: true,
  allowReviews: true,

  showDeveloperInfo: true,
  developerName: "مهرشاد روحی",
  developerEmail: "mehrshadruhi87@gmail.com",
  developerPhone: "09102554874",
  developerInstagram: "mehrshad_87r",
  developerTelegram: "@otlaw_mehrshad",
};

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function mergePlatformSettings(
  partial?: Partial<PlatformSettings> | null
): PlatformSettings {
  const src = partial ?? {};
  const validPalette = THEME_PALETTES.some((p) => p.id === src.themePalette)
    ? (src.themePalette as ThemePaletteId)
    : DEFAULT_PLATFORM_SETTINGS.themePalette;
  const validFont = SITE_FONTS.some((f) => f.id === src.fontFamily)
    ? (src.fontFamily as SiteFontId)
    : DEFAULT_PLATFORM_SETTINGS.fontFamily;
  const validRadius =
    src.borderRadius && src.borderRadius in RADIUS_PRESETS
      ? (src.borderRadius as RadiusPresetId)
      : DEFAULT_PLATFORM_SETTINGS.borderRadius;

  return {
    themePalette: validPalette,
    fontFamily: validFont,
    baseFontSize: clampNumber(
      src.baseFontSize,
      DEFAULT_PLATFORM_SETTINGS.baseFontSize,
      14,
      18
    ),
    headingScale: clampNumber(
      src.headingScale,
      DEFAULT_PLATFORM_SETTINGS.headingScale,
      0.9,
      1.2
    ),
    lineHeight: clampNumber(
      src.lineHeight,
      DEFAULT_PLATFORM_SETTINGS.lineHeight,
      1.45,
      1.95
    ),
    borderRadius: validRadius,

    brandPrimaryText: normalizeString(
      src.brandPrimaryText,
      DEFAULT_PLATFORM_SETTINGS.brandPrimaryText
    ),
    brandAccentText: normalizeString(
      src.brandAccentText,
      DEFAULT_PLATFORM_SETTINGS.brandAccentText
    ),
    siteTitle: normalizeString(
      src.siteTitle,
      DEFAULT_PLATFORM_SETTINGS.siteTitle
    ),
    footerTagline: normalizeString(
      src.footerTagline,
      DEFAULT_PLATFORM_SETTINGS.footerTagline
    ),
    copyrightText: normalizeString(
      src.copyrightText,
      DEFAULT_PLATFORM_SETTINGS.copyrightText
    ),

    heroKicker: normalizeString(
      src.heroKicker,
      DEFAULT_PLATFORM_SETTINGS.heroKicker
    ),
    heroTitle: normalizeString(
      src.heroTitle,
      DEFAULT_PLATFORM_SETTINGS.heroTitle
    ),
    heroSubtitle: normalizeString(
      src.heroSubtitle,
      DEFAULT_PLATFORM_SETTINGS.heroSubtitle
    ),
    featuredCoursesLimit: clampNumber(
      src.featuredCoursesLimit,
      DEFAULT_PLATFORM_SETTINGS.featuredCoursesLimit,
      3,
      12
    ),

    showAnnouncementBar:
      typeof src.showAnnouncementBar === "boolean"
        ? src.showAnnouncementBar
        : DEFAULT_PLATFORM_SETTINGS.showAnnouncementBar,
    announcementText:
      typeof src.announcementText === "string"
        ? src.announcementText.trim()
        : DEFAULT_PLATFORM_SETTINGS.announcementText,
    announcementLink:
      typeof src.announcementLink === "string"
        ? src.announcementLink.trim() || "/courses"
        : DEFAULT_PLATFORM_SETTINGS.announcementLink,

    showCategoriesSection:
      typeof src.showCategoriesSection === "boolean"
        ? src.showCategoriesSection
        : DEFAULT_PLATFORM_SETTINGS.showCategoriesSection,
    showRoadmapsSection:
      typeof src.showRoadmapsSection === "boolean"
        ? src.showRoadmapsSection
        : DEFAULT_PLATFORM_SETTINGS.showRoadmapsSection,
    showTestimonialsSection:
      typeof src.showTestimonialsSection === "boolean"
        ? src.showTestimonialsSection
        : DEFAULT_PLATFORM_SETTINGS.showTestimonialsSection,
    showTrustBadges:
      typeof src.showTrustBadges === "boolean"
        ? src.showTrustBadges
        : DEFAULT_PLATFORM_SETTINGS.showTrustBadges,

    allowRegistration:
      typeof src.allowRegistration === "boolean"
        ? src.allowRegistration
        : DEFAULT_PLATFORM_SETTINGS.allowRegistration,
    allowCoupons:
      typeof src.allowCoupons === "boolean"
        ? src.allowCoupons
        : DEFAULT_PLATFORM_SETTINGS.allowCoupons,
    allowReviews:
      typeof src.allowReviews === "boolean"
        ? src.allowReviews
        : DEFAULT_PLATFORM_SETTINGS.allowReviews,

    showDeveloperInfo:
      typeof src.showDeveloperInfo === "boolean"
        ? src.showDeveloperInfo
        : DEFAULT_PLATFORM_SETTINGS.showDeveloperInfo,
    developerName: normalizeString(
      src.developerName,
      DEFAULT_PLATFORM_SETTINGS.developerName
    ),
    developerEmail: normalizeString(
      src.developerEmail,
      DEFAULT_PLATFORM_SETTINGS.developerEmail
    ),
    developerPhone: normalizeString(
      src.developerPhone,
      DEFAULT_PLATFORM_SETTINGS.developerPhone
    ),
    developerInstagram: normalizeString(
      src.developerInstagram,
      DEFAULT_PLATFORM_SETTINGS.developerInstagram
    ),
    developerTelegram: normalizeString(
      src.developerTelegram,
      DEFAULT_PLATFORM_SETTINGS.developerTelegram
    ),
  };
}

export function getThemePalette(id: ThemePaletteId): ThemePaletteDefinition {
  return (
    THEME_PALETTES.find((p) => p.id === id) ?? THEME_PALETTES[0]
  );
}

export function getSiteFont(id: SiteFontId): SiteFontDefinition {
  return SITE_FONTS.find((f) => f.id === id) ?? SITE_FONTS[0];
}

export function applyPlatformSettingsToDocument(
  settings: PlatformSettings
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const palette = getThemePalette(settings.themePalette);
  const font = getSiteFont(settings.fontFamily);
  const radius = RADIUS_PRESETS[settings.borderRadius] ?? RADIUS_PRESETS.default;

  const isDarkMode = root.classList.contains("dark");
  for (const [key, value] of Object.entries(palette.cssVars)) {
    if (
      !isDarkMode &&
      (key === "--site-bg" || key.startsWith("--color-slate-"))
    ) {
      continue;
    }
    root.style.setProperty(key, value);
  }

  root.style.setProperty("--font-sans", font.cssFamily);
  root.style.fontSize = `${settings.baseFontSize}px`;
  root.style.setProperty("--site-line-height", String(settings.lineHeight));

  const scale = settings.headingScale;
  root.style.setProperty("--text-xl", `${(1.25 * scale).toFixed(3)}rem`);
  root.style.setProperty("--text-2xl", `${(1.5 * scale).toFixed(3)}rem`);
  root.style.setProperty("--text-3xl", `${(1.875 * scale).toFixed(3)}rem`);
  root.style.setProperty("--text-5xl", `${(3 * scale).toFixed(3)}rem`);
  root.style.setProperty("--text-6xl", `${(3.75 * scale).toFixed(3)}rem`);

  root.style.setProperty("--radius-lg", radius.lg);
  root.style.setProperty("--radius-xl", radius.xl);
  root.style.setProperty("--radius-2xl", radius["2xl"]);

  if (settings.siteTitle) {
    document.title = settings.siteTitle;
  }
}
