import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";
import {
  RADIUS_PRESETS,
  SITE_FONTS,
  THEME_PALETTES,
  getSiteFont,
} from "../../utils/themeSettings";
import { toPersianDigits } from "../../utils/formatters";
import type {
  PlatformSettings,
  RadiusPresetId,
} from "../../types";
import { toast } from "sonner";
import {
  Check,
  Layout,
  Palette,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Type,
} from "lucide-react";

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-xs font-bold text-white cursor-pointer"
        >
          {label}
        </label>
        <p className="mt-0.5 text-[11px] text-slate-400">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors px-1 ${
          checked
            ? "border-indigo-500 bg-indigo-600 justify-end"
            : "border-slate-700 bg-slate-800 justify-start"
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black shadow transition-transform ${
            checked ? "text-indigo-700" : "text-slate-600"
          }`}
        >
          {checked ? "✓" : "×"}
        </span>
      </button>
    </div>
  );
}

export function AdminSettingsTab() {
  const { settings, previewSettings, updateSettingsState } = useAuth();
  const [savedSnapshot, setSavedSnapshot] = useState<PlatformSettings>(settings);
  const [draft, setDraft] = useState<PlatformSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const committedRef = useRef(settings);

  useEffect(() => {
    committedRef.current = savedSnapshot;
  }, [savedSnapshot]);

  // Sync live preview whenever draft changes without calling parent setState inside updater
  useEffect(() => {
    previewSettings(draft);
  }, [draft, previewSettings]);

  // Restore saved settings if user navigates away with unsaved preview
  useEffect(() => {
    return () => {
      previewSettings(committedRef.current);
    };
  }, [previewSettings]);

  const updateDraft = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedSnapshot);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest<{ settings: PlatformSettings }>(
        "/api/admin/settings",
        {
          method: "PUT",
          body: JSON.stringify(draft),
        }
      );
      committedRef.current = res.settings;
      setSavedSnapshot(res.settings);
      setDraft(res.settings);
      updateSettingsState(res.settings);
      toast.success("تنظیمات پلتفرم با موفقیت ذخیره و روی کل سایت اعمال شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(savedSnapshot);
    previewSettings(savedSnapshot);
    toast.info("پیش‌نمایش لغو شد و تنظیمات ذخیره‌شده بازگردانی گردید.");
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await apiRequest<{ settings: PlatformSettings }>(
        "/api/admin/settings/reset",
        { method: "POST" }
      );
      committedRef.current = res.settings;
      setSavedSnapshot(res.settings);
      setDraft(res.settings);
      updateSettingsState(res.settings);
      toast.success("تمام تنظیمات به حالت پیش‌فرض کارخانه بازگردانی شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بازگردانی تنظیمات");
    } finally {
      setResetting(false);
    }
  };

  const activeFont = getSiteFont(draft.fontFamily);

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Top Status & Save Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div>
          <h2 className="text-base font-black text-white">
            تنظیمات جامع پلتفرم کدآکادمی
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            تم رنگی، فونت و اندازه‌ها، متن‌های صفحه اصلی و امکانات پلتفرم را با پیش‌نمایش زنده مدیریت کنید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              لغو تغییرات
            </button>
          )}
          <button
            type="button"
            disabled={resetting || saving}
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:border-rose-500/50 hover:text-rose-300 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>بازگردانی پیش‌فرض</span>
          </button>
          <button
            type="submit"
            disabled={saving || resetting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 5 COLOR PALETTES */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                پالت رنگی سایت (۵ تم اختصاصی)
              </h3>
              <p className="text-xs text-slate-400">
                با انتخاب هر پالت، رنگ پس‌زمینه، کارت‌ها، دکمه‌ها و لینک‌های کل سایت بلافاصله تغییر می‌کند.
              </p>
            </div>
          </div>
          {isDirty && (
            <span className="text-[11px] font-bold text-amber-400 shrink-0">
              پیش‌نمایش زنده فعال
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {THEME_PALETTES.map((palette) => {
            const active = draft.themePalette === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                aria-pressed={active}
                onClick={() => updateDraft("themePalette", palette.id)}
                className={`group flex flex-col justify-between rounded-2xl border p-4 text-right transition-all ${
                  active
                    ? "border-indigo-400 bg-indigo-600/15 ring-2 ring-indigo-500/30"
                    : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                }`}
              >
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-white">
                      {palette.name}
                    </span>
                    {active && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* 5-color swatch bar */}
                  <div
                    className="grid grid-cols-5 gap-1.5 rounded-xl border border-slate-800/90 bg-slate-950 p-1.5"
                    aria-hidden="true"
                  >
                    {palette.swatches.map((hex, i) => (
                      <span
                        key={`${palette.id}-${i}`}
                        className="h-6 rounded-lg border border-white/10"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  {palette.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: TYPOGRAPHY, FONT SIZES & RADIUS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
            <Type className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              فونت، اندازه نوشته‌ها و انحنای المان‌ها
            </h3>
            <p className="text-xs text-slate-400">
              انتخاب فونت فارسی سایت، اندازه پایه متن، مقیاس تیترها، فاصله خطوط و میزان گردی کارت‌ها
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Font selector cards */}
          <div className="lg:col-span-7 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              خانواده فونت سایت (۵ فونت فارسی)
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SITE_FONTS.map((font) => {
                const active = draft.fontFamily === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateDraft("fontFamily", font.id)}
                    style={{ fontFamily: font.cssFamily }}
                    className={`rounded-xl border p-3.5 text-right transition-colors ${
                      active
                        ? "border-indigo-400 bg-indigo-600/15"
                        : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {font.name}
                      </span>
                      {active && (
                        <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {font.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font sizing controls + Live typography specimen */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <label
                    htmlFor="settings-base-font-size"
                    className="font-bold text-slate-200"
                  >
                    اندازه فونت پایه سایت
                  </label>
                  <span className="font-mono font-bold text-indigo-400 tabular-nums">
                    {toPersianDigits(draft.baseFontSize)} px
                  </span>
                </div>
                <input
                  id="settings-base-font-size"
                  type="range"
                  min={14}
                  max={18}
                  step={1}
                  value={draft.baseFontSize}
                  onChange={(e) =>
                    updateDraft("baseFontSize", Number(e.target.value))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {[14, 15, 16, 17, 18].map((px) => (
                    <button
                      key={px}
                      type="button"
                      onClick={() => updateDraft("baseFontSize", px)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold tabular-nums transition-colors ${
                        draft.baseFontSize === px
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {toPersianDigits(px)}px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-200 mb-2">
                  مقیاس اندازه تیترها
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "کوچک", val: 0.9 },
                    { label: "استاندارد", val: 1 },
                    { label: "بزرگ", val: 1.1 },
                    { label: "درشت", val: 1.2 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => updateDraft("headingScale", item.val)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold transition-colors ${
                        draft.headingScale === item.val
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-200 mb-2">
                  فاصله بین خطوط متن
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "فشرده (۱.۵)", val: 1.5 },
                    { label: "استاندارد (۱.۶۵)", val: 1.65 },
                    { label: "باز (۱.۸۵)", val: 1.85 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => updateDraft("lineHeight", item.val)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold transition-colors ${
                        draft.lineHeight === item.val
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-200 mb-2">
                  انحنای گوشه کارت‌ها و دکمه‌ها
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    Object.entries(RADIUS_PRESETS) as Array<
                      [RadiusPresetId, { label: string }]
                    >
                  ).map(([id, preset]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateDraft("borderRadius", id)}
                      className={`rounded-lg py-1.5 text-[11px] font-bold transition-colors ${
                        draft.borderRadius === id
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Typography Preview Card */}
            <div
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2"
              style={{
                fontFamily: activeFont.cssFamily,
                lineHeight: draft.lineHeight,
              }}
            >
              <div className="text-[11px] font-bold text-indigo-400">
                پیش‌نمایش زنده فونت: {activeFont.name}
              </div>
              <div
                className="font-black text-white"
                style={{ fontSize: `${1.15 * draft.headingScale}rem` }}
              >
                مهندسی نرم‌افزار در مقیاس واقعی
              </div>
              <p className="text-xs text-slate-300">
                این متن نمونه با اندازه پایه{" "}
                <span className="font-bold tabular-nums text-white">
                  {toPersianDigits(draft.baseFontSize)} پیکسل
                </span>{" "}
                و فاصله خطوط {toPersianDigits(draft.lineHeight)} نمایش داده می‌شود.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: BRANDING, HERO & ANNOUNCEMENT BAR */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              هویت برند، متن‌های صفحه اصلی و نوار اعلان
            </h3>
            <p className="text-xs text-slate-400">
              نام آکادمی، عنوان مرورگر، تیتر صفحه نخست، تعداد دوره‌های صفحه اول و نوار اطلاع‌رسانی بالای سایت
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="set-brand-primary"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              بخش اول نام برند (لوگو)
            </label>
            <input
              id="set-brand-primary"
              type="text"
              value={draft.brandPrimaryText}
              onChange={(e) => updateDraft("brandPrimaryText", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label
              htmlFor="set-brand-accent"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              بخش رنگی نام برند (لوگو)
            </label>
            <input
              id="set-brand-accent"
              type="text"
              value={draft.brandAccentText}
              onChange={(e) => updateDraft("brandAccentText", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label
              htmlFor="set-featured-limit"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              تعداد دوره‌ها در صفحه اصلی
            </label>
            <select
              id="set-featured-limit"
              value={draft.featuredCoursesLimit}
              onChange={(e) =>
                updateDraft("featuredCoursesLimit", Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value={3}>۳ دوره</option>
              <option value={6}>۶ دوره</option>
              <option value={9}>۹ دوره</option>
              <option value={12}>۱۲ دوره</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="set-site-title"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              عنوان تب مرورگر (SEO Title)
            </label>
            <input
              id="set-site-title"
              type="text"
              value={draft.siteTitle}
              onChange={(e) => updateDraft("siteTitle", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="set-hero-kicker"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              متن خط بالای تیتر اصلی (Hero Kicker)
            </label>
            <input
              id="set-hero-kicker"
              type="text"
              value={draft.heroKicker}
              onChange={(e) => updateDraft("heroKicker", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="set-hero-title"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              تیتر اصلی صفحه نخست (H1)
            </label>
            <input
              id="set-hero-title"
              type="text"
              value={draft.heroTitle}
              onChange={(e) => updateDraft("heroTitle", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="set-hero-subtitle"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              توضیحات زیر تیتر اصلی
            </label>
            <textarea
              id="set-hero-subtitle"
              rows={2}
              value={draft.heroSubtitle}
              onChange={(e) => updateDraft("heroSubtitle", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="set-footer-tagline"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              معرفی کوتاه در فوتر
            </label>
            <input
              id="set-footer-tagline"
              type="text"
              value={draft.footerTagline}
              onChange={(e) => updateDraft("footerTagline", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label
              htmlFor="set-copyright"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              متن کپی‌رایت فوتر
            </label>
            <input
              id="set-copyright"
              type="text"
              value={draft.copyrightText}
              onChange={(e) => updateDraft("copyrightText", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Announcement bar */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <ToggleRow
            id="toggle-announcement"
            label="نمایش نوار اطلاع‌رسانی بالای سایت"
            description="نوار رنگی ویژه جشنواره‌ها، تخفیف‌ها و اطلاعیه‌های مهم در بالاترین بخش تمام صفحات"
            checked={draft.showAnnouncementBar}
            onChange={(val) => updateDraft("showAnnouncementBar", val)}
          />
          {draft.showAnnouncementBar && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="set-announcement-text"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  متن نوار اطلاع‌رسانی
                </label>
                <input
                  id="set-announcement-text"
                  type="text"
                  value={draft.announcementText}
                  onChange={(e) =>
                    updateDraft("announcementText", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="set-announcement-link"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  مسیر لینک (اختیاری)
                </label>
                <input
                  id="set-announcement-link"
                  type="text"
                  dir="ltr"
                  value={draft.announcementLink}
                  onChange={(e) =>
                    updateDraft("announcementLink", e.target.value)
                  }
                  placeholder="/courses"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: FEATURE TOGGLES & DEVELOPER INFO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
              <Layout className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                نمایش بخش‌های صفحه اصلی و فوتر
              </h3>
              <p className="text-xs text-slate-400">
                مدیریت بخش‌های قابل مشاهده برای کاربران سایت
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              id="toggle-categories"
              label="نمایش دپارتمان‌های تخصصی"
              description="باکس دسته‌بندی‌های برنامه‌نویسی در صفحه اصلی"
              checked={draft.showCategoriesSection}
              onChange={(v) => updateDraft("showCategoriesSection", v)}
            />
            <ToggleRow
              id="toggle-roadmaps"
              label="نمایش نقشه‌های راه یادگیری"
              description="بخش مسیرهای صفر تا استخدام در صفحه اصلی"
              checked={draft.showRoadmapsSection}
              onChange={(v) => updateDraft("showRoadmapsSection", v)}
            />
            <ToggleRow
              id="toggle-testimonials"
              label="نمایش نظرات فارغ‌التحصیلان"
              description="کارت‌های تجربه دانشجویان در پایین صفحه اصلی"
              checked={draft.showTestimonialsSection}
              onChange={(v) => updateDraft("showTestimonialsSection", v)}
            />
            <ToggleRow
              id="toggle-trust-badges"
              label="نمایش نمادهای اعتماد و ضمانت در فوتر"
              description="باکس پرداخت امن شاپرک و گواهینامه معتبر"
              checked={draft.showTrustBadges}
              onChange={(v) => updateDraft("showTrustBadges", v)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                کنترل دسترسی امکانات و اطلاعات توسعه‌دهنده
              </h3>
              <p className="text-xs text-slate-400">
                فعال/غیرفعال‌سازی عملیات عمومی کاربران و ویرایش اطلاعات تماس
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              id="toggle-registration"
              label="امکان ثبت‌نام کاربران جدید"
              description="در صورت غیرفعال شدن، ثبت‌نام دانشجوی جدید موقتاً متوقف می‌شود"
              checked={draft.allowRegistration}
              onChange={(v) => updateDraft("allowRegistration", v)}
            />
            <ToggleRow
              id="toggle-coupons"
              label="استفاده از کد تخفیف در سبد خرید"
              description="نمایش و اعتبارسنجی کدهای تخفیف هنگام تسویه حساب"
              checked={draft.allowCoupons}
              onChange={(v) => updateDraft("allowCoupons", v)}
            />
            <ToggleRow
              id="toggle-reviews"
              label="امکان ثبت دیدگاه دانشجویان روی دوره‌ها"
              description="اجازه ارسال نظر و امتیازدهی در صفحه جزئیات هر دوره"
              checked={draft.allowReviews}
              onChange={(v) => updateDraft("allowReviews", v)}
            />
            <ToggleRow
              id="toggle-dev-info"
              label="نمایش ستون توسعه‌دهنده و ارتباط در فوتر"
              description="نمایش مشخصات تماس، ایمیل، اینستاگرام و تلگرام در پایین سایت"
              checked={draft.showDeveloperInfo}
              onChange={(v) => updateDraft("showDeveloperInfo", v)}
            />
          </div>

          {draft.showDeveloperInfo && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-800 pt-4">
              <div>
                <label
                  htmlFor="set-dev-name"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  نام توسعه‌دهنده
                </label>
                <input
                  id="set-dev-name"
                  type="text"
                  value={draft.developerName}
                  onChange={(e) => updateDraft("developerName", e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="set-dev-phone"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  شماره تماس
                </label>
                <input
                  id="set-dev-phone"
                  type="text"
                  dir="ltr"
                  value={draft.developerPhone}
                  onChange={(e) =>
                    updateDraft("developerPhone", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="set-dev-email"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  ایمیل تماس
                </label>
                <input
                  id="set-dev-email"
                  type="email"
                  dir="ltr"
                  value={draft.developerEmail}
                  onChange={(e) =>
                    updateDraft("developerEmail", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="set-dev-ig"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  آیدی اینستاگرام
                </label>
                <input
                  id="set-dev-ig"
                  type="text"
                  dir="ltr"
                  value={draft.developerInstagram}
                  onChange={(e) =>
                    updateDraft("developerInstagram", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="set-dev-tg"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  آیدی تلگرام
                </label>
                <input
                  id="set-dev-tg"
                  type="text"
                  dir="ltr"
                  value={draft.developerTelegram}
                  onChange={(e) =>
                    updateDraft("developerTelegram", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}
