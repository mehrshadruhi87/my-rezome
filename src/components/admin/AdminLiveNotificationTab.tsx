import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_LIVE_NOTIFICATION,
  SITE_NOTIFICATIONS_SQL_SETUP,
  fetchLiveNotificationFromSupabase,
  normalizePromoCode,
  saveLiveNotificationToSupabase,
  type LiveNotification,
} from "../../lib/siteNotifications";
import {
  ArrowLeft,
  Bell,
  Check,
  Copy,
  Database,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
} from "lucide-react";

export function AdminLiveNotificationTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncSource, setSyncSource] = useState<"supabase" | "local">("local");
  const [missingTable, setMissingTable] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [title, setTitle] = useState(DEFAULT_LIVE_NOTIFICATION.title);
  const [message, setMessage] = useState(DEFAULT_LIVE_NOTIFICATION.message);
  const [promoCode, setPromoCode] = useState(
    DEFAULT_LIVE_NOTIFICATION.promoCode
  );
  const [ctaLabel, setCtaLabel] = useState(DEFAULT_LIVE_NOTIFICATION.ctaLabel);
  const [ctaLink, setCtaLink] = useState(DEFAULT_LIVE_NOTIFICATION.ctaLink);
  const [isActive, setIsActive] = useState(DEFAULT_LIVE_NOTIFICATION.isActive);
  const [updatedAt, setUpdatedAt] = useState(
    DEFAULT_LIVE_NOTIFICATION.updatedAt
  );

  const hydrateFromNotification = (n: LiveNotification) => {
    setTitle(n.title);
    setMessage(n.message);
    setPromoCode(n.promoCode);
    setCtaLabel(n.ctaLabel);
    setCtaLink(n.ctaLink);
    setIsActive(n.isActive);
    setUpdatedAt(n.updatedAt);
  };

  const loadCurrent = async () => {
    setLoading(true);
    try {
      const res = await fetchLiveNotificationFromSupabase();
      hydrateFromNotification(res.notification);
      setSyncSource(res.source);
      setMissingTable(Boolean(res.missingTable));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCurrent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("لطفاً متن پیام نوتیفیکیشن را وارد کنید.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveLiveNotificationToSupabase({
        title: title.trim() || DEFAULT_LIVE_NOTIFICATION.title,
        message: message.trim(),
        promoCode: normalizePromoCode(promoCode),
        ctaLabel: ctaLabel.trim() || "مشاهده دوره‌ها",
        ctaLink: ctaLink.trim() || "/courses",
        isActive,
      });

      hydrateFromNotification(res.notification);

      if (res.syncedToSupabase) {
        setSyncSource("supabase");
        setMissingTable(false);
        toast.success(
          "نوتیفیکیشن زنده با موفقیت در پایگاه‌داده Supabase ذخیره و برای تمام کاربران منتشر شد."
        );
      } else if (res.missingTable) {
        setSyncSource("local");
        setMissingTable(true);
        toast.warning(
          "تغییرات روی این دستگاه اعمال شد، اما جدول site_notifications هنوز در Supabase ساخته نشده است. کد SQL پایین را در Supabase اجرا کنید."
        );
      } else {
        toast.error(
          res.errorMessage || "خطا در ذخیره نوتیفیکیشن در Supabase"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SITE_NOTIFICATIONS_SQL_SETUP);
      setCopiedSql(true);
      toast.success("دستور SQL ایجاد جدول site_notifications کپی شد.");
      window.setTimeout(() => setCopiedSql(false), 2200);
    } catch {
      toast.error("امکان کپی خودکار وجود ندارد؛ متن SQL را دستی انتخاب کنید.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Form Controls */}
        <form
          onSubmit={handleSave}
          data-testid="admin-live-notification-form"
          className="lg:col-span-7 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/80 p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  نوتیفیکیشن زنده / بنر تخفیف (متصل به Supabase)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  پیام اعلان، کد تخفیف و وضعیت نمایش را ویرایش کنید تا به‌صورت دائمی و زنده برای تمام کاربران اعمال شود.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadCurrent()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)] transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>بروزرسانی از سرور</span>
            </button>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/70 p-4">
            <div>
              <label
                htmlFor="live-notif-active-toggle"
                className="block text-xs font-black text-slate-900 dark:text-white cursor-pointer"
              >
                فعال‌سازی نوتیفیکیشن زنده در سایت
              </label>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                در صورت غیرفعال کردن، باکس اعلان شناور برای هیچ کاربری نمایش داده نمی‌شود.
              </p>
            </div>
            <button
              id="live-notif-active-toggle"
              type="button"
              role="switch"
              aria-checked={isActive}
              data-testid="admin-notif-active-toggle"
              onClick={() => setIsActive((prev) => !prev)}
              className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors px-1 ${
                isActive
                  ? "border-emerald-500 bg-emerald-600 justify-end"
                  : "border-slate-400 dark:border-slate-700 bg-slate-300 dark:bg-slate-800 justify-start"
              }`}
            >
              <span className="sr-only">فعال‌سازی نوتیفیکیشن زنده</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black shadow ${
                  isActive ? "text-emerald-700" : "text-slate-600"
                }`}
              >
                {isActive ? "✓" : "×"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="live-notif-title"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                عنوان اعلان
              </label>
              <input
                id="live-notif-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="جشنواره ویژه کدآکادمی"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[var(--accent-500)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="live-notif-promo"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                کد تخفیف (اختیاری)
              </label>
              <input
                id="live-notif-promo"
                type="text"
                dir="ltr"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="BAHAR30"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3.5 py-2.5 font-mono text-xs font-bold uppercase text-slate-900 dark:text-white focus:border-[var(--accent-500)] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="live-notif-message"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                متن پیام اعلان / تخفیف *
              </label>
              <textarea
                id="live-notif-message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="۳۰٪ تخفیف ویژه روی تمام دوره‌های برنامه‌نویسی و هوش مصنوعی..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3.5 py-2.5 text-xs leading-relaxed text-slate-900 dark:text-white focus:border-[var(--accent-500)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="live-notif-cta-label"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                متن دکمه اقدام (CTA)
              </label>
              <input
                id="live-notif-cta-label"
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="مشاهده دوره‌ها"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[var(--accent-500)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="live-notif-cta-link"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                مسیر لینک دکمه
              </label>
              <input
                id="live-notif-cta-link"
                type="text"
                dir="ltr"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/courses"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-slate-900 dark:text-white focus:border-[var(--accent-500)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <Database
                className={`h-4 w-4 ${
                  syncSource === "supabase"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
              <span className="text-slate-700 dark:text-slate-300">
                {syncSource === "supabase"
                  ? "متصل به جدول PostgreSQL در Supabase"
                  : "در انتظار ایجاد جدول site_notifications در Supabase"}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              data-testid="admin-notif-save-btn"
              className="btn-3d inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>
                {saving
                  ? "در حال ذخیره در Supabase..."
                  : "ذخیره و انتشار زنده در Supabase"}
              </span>
            </button>
          </div>
        </form>

        {/* Live Visual Preview + SQL Table Helper */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                پیش‌نمایش زنده باکس اعلان کاربران
              </h3>
              <span
                className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isActive ? "فعال و قابل مشاهده" : "غیرفعال (مخفی)"}
              </span>
            </div>

            <div
              className={`relative overflow-hidden rounded-2xl border border-[var(--accent-500)]/45 bg-[#F1F5F9] dark:bg-slate-950/90 p-4 shadow-xl transition-opacity ${
                isActive ? "opacity-100" : "opacity-45"
              }`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-[var(--accent-400)] via-[rgb(var(--accent-secondary-rgb))] to-[var(--accent-600)]"
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{title.trim() || "عنوان اعلان"}</span>
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                {message.trim() || "متن اعلان اینجا نمایش داده می‌شود..."}
              </p>
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
                {promoCode.trim() ? (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--accent-500)]/60 bg-[var(--accent-500)]/12 px-3 py-1.5 text-xs font-black text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                    <Tag className="h-3.5 w-3.5" />
                    <span dir="ltr" className="font-mono tracking-wider">
                      {normalizePromoCode(promoCode)}
                    </span>
                    <Copy className="h-3 w-3 opacity-75" />
                  </span>
                ) : (
                  <span />
                )}
                <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-l from-[var(--accent-500)] to-[var(--accent-600)] px-3 py-1.5 text-[11px] font-bold text-white">
                  <span>{ctaLabel.trim() || "مشاهده دوره‌ها"}</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {updatedAt && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                آخرین بروزرسانی:{" "}
                <span dir="ltr" className="font-mono">
                  {new Date(updatedAt).toLocaleString("fa-IR")}
                </span>
              </p>
            )}
          </div>

          {/* SQL Table Setup Helper (shown prominently when table doesn't exist yet, or collapsible info) */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Database className="h-4 w-4 text-[var(--accent-500)]" />
                <span>ساختار جدول PostgreSQL (Supabase SQL)</span>
              </h3>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)] transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>کپی SQL</span>
                  </>
                )}
              </button>
            </div>
            {missingTable && (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] leading-relaxed font-semibold text-amber-800 dark:text-amber-300">
                جدول <code className="font-mono">public.site_notifications</code>{" "}
                در پروژه Supabase یافت نشد. این کد را یک بار در بخش{" "}
                <strong>SQL Editor</strong> پنل Supabase اجرا کنید تا ذخیره دائمی بین همه دستگاه‌ها فعال شود:
              </p>
            )}
            <pre
              dir="ltr"
              className="max-h-48 overflow-auto rounded-xl border border-slate-300/80 dark:border-slate-800 bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-emerald-300"
            >
              {SITE_NOTIFICATIONS_SQL_SETUP}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
