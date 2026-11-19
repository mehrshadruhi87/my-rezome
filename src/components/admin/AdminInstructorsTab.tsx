import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { formatPersianDate, toPersianDigits } from "../../utils/formatters";
import type { InstructorApplication, InstructorStatus } from "../../types";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Phone,
  XCircle,
} from "lucide-react";

interface AdminInstructorsTabProps {
  onStatusChanged?: () => Promise<void> | void;
}

export function AdminInstructorsTab({
  onStatusChanged,
}: AdminInstructorsTabProps) {
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | InstructorStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ instructors: InstructorApplication[] }>(
        "/api/admin/instructors"
      );
      setApplications(res.instructors || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "خطا در بارگذاری درخواست‌های مدرسی"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleSetStatus = async (id: string, status: InstructorStatus) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/api/admin/instructors/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(
        status === "approved"
          ? "مدرس تایید شد و دسترسی انتشار دوره برای او فعال گردید."
          : status === "rejected"
          ? "درخواست مدرس رد شد."
          : "وضعیت به در انتظار بررسی تغییر یافت."
      );
      await loadApplications();
      if (onStatusChanged) await onStatusChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/80 p-5">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span>بررسی و تایید درخواست‌های مدرسین</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            مدرسین پس از ثبت‌نام در انتظار تایید می‌مانند و تنها پس از تایید شما امکان انتشار دوره دارند. ({toPersianDigits(pendingCount)} درخواست در انتظار)
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all" as const, label: "همه" },
            { id: "pending" as const, label: "در انتظار" },
            { id: "approved" as const, label: "تاییدشده" },
            { id: "rejected" as const, label: "ردشده" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === f.id
                  ? "bg-[var(--accent-600)] text-white"
                  : "border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 text-slate-700 dark:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-10 text-center text-xs text-slate-600 dark:text-slate-400">
          درخواستی در این وضعیت ثبت نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {app.name}
                  </h3>
                  <div className="mt-1 text-xs font-semibold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                    تخصص: {app.specialty}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                    app.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : app.status === "rejected"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {app.status === "approved" ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> تاییدشده
                    </>
                  ) : app.status === "rejected" ? (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> ردشده
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5" /> در انتظار تایید
                    </>
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                {app.phone && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5" />
                    {app.phone}
                  </span>
                )}
                {app.email && <span className="font-mono">{app.email}</span>}
                <span>تاریخ ثبت: {formatPersianDate(app.createdAt)}</span>
              </div>

              {app.bio && (
                <p className="rounded-xl border border-slate-300/80 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {app.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-300/80 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  disabled={updatingId === app.id || app.status === "approved"}
                  onClick={() => handleSetStatus(app.id, "approved")}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تایید و فعال‌سازی مدرس</span>
                </button>
                <button
                  type="button"
                  disabled={updatingId === app.id || app.status === "rejected"}
                  onClick={() => handleSetStatus(app.id, "rejected")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  <span>رد درخواست</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
