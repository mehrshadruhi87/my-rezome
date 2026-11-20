import React, { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "../../router";
import {
  LIVE_NOTIFICATION_EVENT,
  fetchLiveNotificationFromSupabase,
  getNotificationSignature,
  loadDismissedNotificationSignature,
  loadLocalLiveNotification,
  saveDismissedNotificationSignature,
  shouldShowLiveNotification,
  type LiveNotification,
} from "../../lib/siteNotifications";
import {
  CODEACADEMY_REALTIME_EVENT,
  type RealtimeUpdateDetail,
} from "../../lib/realtimeSync";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { getDictionary } from "../../lib/i18n";
import { localizeNotificationCopy } from "../../lib/contentLocalization";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

const ENTRANCE_DELAY_MS = 2000;

export function LiveNotificationToast() {
  const { pathname } = useRouter();
  const { language, isRtl } = useUserPreferences();
  const t = getDictionary(language);
  const DirArrow = isRtl ? ArrowLeft : ArrowRight;

  const [notification, setNotification] = useState<LiveNotification>(() =>
    loadLocalLiveNotification()
  );
  const [dismissedSig, setDismissedSig] = useState<string | null>(() =>
    loadDismissedNotificationSignature()
  );
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const syncFromSupabase = useCallback(async () => {
    const res = await fetchLiveNotificationFromSupabase();
    setNotification(res.notification);
  }, []);

  // 2-second delayed slide-down entrance from behind the Navbar
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, ENTRANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    fetchLiveNotificationFromSupabase().then((res) => {
      if (active) {
        setNotification(res.notification);
      }
    });

    const handleLocalUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<LiveNotification>).detail;
      if (detail) {
        setNotification(detail);
        setDismissedSig(loadDismissedNotificationSignature());
        setIsVisible(true);
      }
    };

    const handleRealtimeUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<RealtimeUpdateDetail>).detail;
      if (detail?.table === "site_notifications") {
        void syncFromSupabase();
      }
    };

    const handleWindowFocus = () => {
      void syncFromSupabase();
    };

    window.addEventListener(LIVE_NOTIFICATION_EVENT, handleLocalUpdate);
    window.addEventListener(CODEACADEMY_REALTIME_EVENT, handleRealtimeUpdate);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      active = false;
      window.removeEventListener(LIVE_NOTIFICATION_EVENT, handleLocalUpdate);
      window.removeEventListener(
        CODEACADEMY_REALTIME_EVENT,
        handleRealtimeUpdate
      );
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [syncFromSupabase]);

  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const isSuppressedRoute =
    cleanPath.startsWith("/admin") || cleanPath.startsWith("/auth");

  const shouldRender =
    !isSuppressedRoute &&
    shouldShowLiveNotification(notification, dismissedSig);

  const handleDismiss = () => {
    setIsVisible(false);
    const sig = getNotificationSignature(notification);
    window.setTimeout(() => {
      saveDismissedNotificationSignature(sig);
      setDismissedSig(sig);
    }, 500);
  };

  const handleCopyPromo = () => {
    if (!notification.promoCode) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(notification.promoCode).catch(() => {
        // Ignore clipboard restrictions in embedded frames
      });
    }
  };

  if (!shouldRender) {
    return null;
  }

  const localized = localizeNotificationCopy(notification, language);

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={t.notification.dismissAria}
      data-testid="live-notification-toast"
      data-visible={isVisible ? "true" : "false"}
      className={`absolute top-[58px] sm:top-[64px] inset-x-0 z-30 w-full bg-transparent px-3 sm:px-6 lg:px-10 pt-2 transition-all duration-500 ease-out pointer-events-none ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div
        className={`relative mx-auto max-w-[1400px] overflow-hidden rounded-2xl border border-cyan-500/35 dark:border-cyan-400/25 bg-white/80 dark:bg-slate-950/75 shadow-lg shadow-cyan-950/10 dark:shadow-black/45 backdrop-blur-xl ${
          isVisible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Subtle Top & Bottom Glassmorphic Borders */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-l from-cyan-400/80 via-[var(--accent-500)]/85 to-indigo-500/80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-l from-transparent via-cyan-400/45 to-transparent"
        />

        <div className="flex items-center justify-between gap-2.5 sm:gap-3 px-3.5 py-2 sm:px-5 sm:py-2.5">
          <div className="flex flex-1 flex-wrap items-center justify-start gap-x-2.5 gap-y-1 min-w-0 text-[11px] sm:text-xs">
            {/* Live Pulse & Title */}
            <span className="inline-flex items-center gap-1.5 font-black text-cyan-800 dark:text-cyan-300 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span>{localized.title}:</span>
            </span>

            {/* Message */}
            <span
              data-testid="live-notification-message"
              className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-full sm:max-w-xl lg:max-w-2xl"
            >
              {localized.message}
            </span>

            {/* One-Click Promo Copy Badge */}
            {notification.promoCode && (
              <button
                type="button"
                onClick={handleCopyPromo}
                data-testid="live-notification-promo-btn"
                aria-label={notification.promoCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-cyan-500/65 dark:border-cyan-400/55 bg-cyan-500/12 dark:bg-cyan-400/12 px-2 py-0.5 text-[11px] font-black text-cyan-900 dark:text-cyan-200 hover:bg-cyan-500/22 dark:hover:bg-cyan-400/20 transition-colors shrink-0"
              >
                <Tag className="h-3 w-3 shrink-0" />
                <span dir="ltr" className="font-mono tracking-wider">
                  {notification.promoCode}
                </span>
                {copied ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                    {t.notification.copied}
                  </span>
                ) : (
                  <Copy className="h-3 w-3 opacity-80" />
                )}
              </button>
            )}

            {/* Optional CTA Link */}
            {notification.ctaLink && (
              <Link
                href={notification.ctaLink}
                className="hidden md:inline-flex items-center gap-1 rounded-lg bg-gradient-to-l from-cyan-600 to-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:from-cyan-500 hover:to-indigo-500 transition-colors shrink-0"
              >
                <span>{localized.ctaLabel || t.notification.defaultCta}</span>
                <DirArrow className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t.notification.dismissAria}
            data-testid="dismiss-live-notification"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-300/80 dark:border-white/15 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-cyan-500/50 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
