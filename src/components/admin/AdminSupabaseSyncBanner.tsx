import React, { useEffect, useState } from "react";
import {
  CODEACADEMY_FULL_SUPABASE_SQL,
  SUPABASE_ADMIN_SYNC_EVENT,
  getSupabaseAdminSyncStatus,
  type SupabaseSyncStatus,
} from "../../lib/supabaseAdminSync";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  X,
} from "lucide-react";

export function AdminSupabaseSyncBanner() {
  const [status, setStatus] = useState<SupabaseSyncStatus>(() =>
    getSupabaseAdminSyncStatus()
  );
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<SupabaseSyncStatus>).detail;
      if (detail) {
        setStatus(detail);
      } else {
        setStatus(getSupabaseAdminSyncStatus());
      }
    };
    window.addEventListener(SUPABASE_ADMIN_SYNC_EVENT, handler);
    setStatus(getSupabaseAdminSyncStatus());
    return () => {
      window.removeEventListener(SUPABASE_ADMIN_SYNC_EVENT, handler);
    };
  }, []);

  if (dismissed) {
    return null;
  }

  const hasMissingTables = status.missingTables.length > 0;

  const handleCopySql = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard
        .writeText(CODEACADEMY_FULL_SUPABASE_SQL)
        .then(() =>
          toast.success(
            "اسکریپت SQL جدید (شامل course_reviews، RLS و Realtime) کپی شد."
          )
        )
        .catch(() => {
          toast.info("اسکریپت SQL آماده کپی از کادر زیر است.");
        });
    }
  };

  return (
    <div
      data-testid="admin-supabase-sync-banner"
      className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs">
          <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              <span>
                همگام‌سازی زنده و مستقیم با دیتابیس Supabase PostgreSQL فعال است
              </span>
              <span
                dir="ltr"
                className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300"
              >
                mmimselnvkdbwjyziehj
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
              تمامی تغییرات دوره‌ها، امتیازدهی واقعی دانشجویان (course_reviews)، مسیرهای یادگیری، کدهای تخفیف، اخبار و اعلان‌ها به‌صورت Real-Time بین تمام دستگاه‌ها همگام می‌شوند.
              {hasMissingTables && (
                <span className="mr-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                  (برای فعال‌سازی جداول جدید{" "}
                  <span dir="ltr" className="font-mono">
                    {status.missingTables.join(", ")}
                  </span>{" "}
                  اسکریپت SQL جدید را یک‌بار در Supabase SQL Editor اجرا کنید.)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="copy-new-sql-btn"
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>کپی شد</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>کپی SQL جدید</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowSql((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/35 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-colors"
          >
            <span>{showSql ? "بستن SQL" : "نمایش SQL"}</span>
            {showSql ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            data-testid="dismiss-admin-sql-banner"
            onClick={() => setDismissed(true)}
            aria-label="بستن بنر همگام‌سازی"
            title="بستن بنر"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-white/60 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showSql && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950">
          <pre
            dir="ltr"
            className="max-h-72 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300"
          >
            {CODEACADEMY_FULL_SUPABASE_SQL}
          </pre>
        </div>
      )}
    </div>
  );
}
