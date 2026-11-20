import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  formatPersianDate,
  formatToman,
  toPersianDigits,
} from "../../utils/formatters";
import type {
  ContentSubmissionItem,
  CourseSummary,
  InstructorApplication,
  InstructorStatus,
  ModerationStatus,
} from "../../types";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Film,
  GraduationCap,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";

interface AdminInstructorsTabProps {
  onStatusChanged?: () => Promise<void> | void;
}

interface ModerationPayload {
  submissions: ContentSubmissionItem[];
  pendingCourses: CourseSummary[];
  instructors: InstructorApplication[];
  counts: {
    pendingInstructors: number;
    pendingContent: number;
    totalPending: number;
  };
}

export function AdminInstructorsTab({
  onStatusChanged,
}: AdminInstructorsTabProps) {
  const [section, setSection] = useState<"content" | "instructors">("content");
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [submissions, setSubmissions] = useState<ContentSubmissionItem[]>([]);
  const [pendingCourses, setPendingCourses] = useState<CourseSummary[]>([]);
  const [counts, setCounts] = useState({
    pendingInstructors: 0,
    pendingContent: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ModerationStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>(
    {}
  );

  const loadModerationQueue = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<ModerationPayload>("/api/admin/moderation");
      setApplications(res.instructors || []);
      setSubmissions(res.submissions || []);
      setPendingCourses(res.pendingCourses || []);
      setCounts(
        res.counts || {
          pendingInstructors: 0,
          pendingContent: 0,
          totalPending: 0,
        }
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "خطا در بارگذاری صف بررسی مدرسین و محتوا"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadModerationQueue();
  }, []);

  const handleSetInstructorStatus = async (
    id: string,
    status: InstructorStatus
  ) => {
    setUpdatingId(id);
    try {
      const rejectionReason = rejectionNotes[id]?.trim() || undefined;
      await apiRequest(`/api/admin/instructors/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      });
      toast.success(
        status === "approved"
          ? "مدرس تأیید شد و دسترسی ارسال دوره برای او فعال گردید."
          : status === "rejected"
            ? "درخواست مدرس رد شد."
            : "وضعیت به در انتظار بررسی تغییر یافت."
      );
      await loadModerationQueue();
      if (onStatusChanged) await onStatusChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleModerateContent = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setUpdatingId(id);
    try {
      const rejectionReason = rejectionNotes[id]?.trim() || undefined;
      await apiRequest(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      });
      toast.success(
        status === "approved"
          ? "محتوا تأیید شد و بلافاصله روی سایت منتشر گردید."
          : "محتوا رد شد و دلیل رد شدن برای مدرس ثبت گردید."
      );
      await loadModerationQueue();
      if (onStatusChanged) await onStatusChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "خطا در ثبت نتیجه بررسی محتوا"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Merge orphan pending courses that don't have a submission row yet
  const orphanCourseSubmissions: ContentSubmissionItem[] = pendingCourses
    .filter(
      (pc) =>
        !submissions.some(
          (s) => s.courseId === pc.id && s.status === "pending"
        )
    )
    .map((pc) => ({
      id: pc.id,
      type: "course_create",
      courseId: pc.id,
      courseTitle: pc.title,
      instructorId: pc.instructorId || "",
      instructorName: pc.instructorName,
      instructorEmail: "",
      summary: `دوره در انتظار تأیید · قیمت: ${formatToman(pc.discountPrice ?? pc.price)}`,
      status: "pending",
      rejectionReason: pc.rejectionReason ?? null,
      createdAt: pc.createdAt,
      reviewedAt: null,
    }));

  const allContentItems = [...submissions, ...orphanCourseSubmissions];

  const filteredContent =
    filter === "all"
      ? allContentItems
      : allContentItems.filter((item) => item.status === filter);

  const filteredInstructors =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const getTypeBadge = (type: ContentSubmissionItem["type"]) => {
    if (type === "lesson_upload") {
      return {
        label: "آپلود ویدیو / جلسه",
        icon: Film,
        cls: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
      };
    }
    if (type === "course_edit") {
      return {
        label: "ویرایش دوره / قیمت",
        icon: Edit3,
        cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      };
    }
    return {
      label: "دوره جدید",
      icon: BookOpen,
      cls: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    };
  };

  return (
    <div className="space-y-5">
      {/* Header & Section Switcher */}
      <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/80 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span>تأیید مدرسین و کنترل کیفیت محتوا</span>
              {counts.totalPending > 0 && (
                <span className="rounded-lg bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white tabular-nums">
                  {toPersianDigits(counts.totalPending)} در انتظار
                </span>
              )}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              هیچ دوره، ویرایش یا ویدیوی مدرسین بدون تأیید شما به‌صورت عمومی نمایش داده نمی‌شود. با کلیک روی «تأیید و انتشار»، محتوا بلافاصله روی سایت منتشر و در Supabase ذخیره می‌گردد.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all" as const, label: "همه" },
              { id: "pending" as const, label: "در انتظار تأیید" },
              { id: "approved" as const, label: "تأییدشده" },
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

        {/* Sub-tabs: Content Submissions vs Instructor Registrations */}
        <div className="flex flex-wrap gap-2 border-t border-slate-300/80 dark:border-slate-800 pt-4">
          <button
            type="button"
            data-testid="moderation-subtab-content"
            onClick={() => setSection("content")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              section === "content"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950"
                : "border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>دوره‌ها، ویرایش‌ها و ویدیوهای مدرسین</span>
            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 tabular-nums">
              {toPersianDigits(counts.pendingContent)}
            </span>
          </button>

          <button
            type="button"
            data-testid="moderation-subtab-instructors"
            onClick={() => setSection("instructors")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              section === "instructors"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950"
                : "border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>درخواست‌های ثبت‌نام مدرسین</span>
            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 tabular-nums">
              {toPersianDigits(counts.pendingInstructors)}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse" />
      ) : section === "content" ? (
        filteredContent.length === 0 ? (
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-10 text-center text-xs text-slate-600 dark:text-slate-400">
            موردی از محتوای مدرسین در این وضعیت ثبت نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredContent.map((item) => {
              const badge = getTypeBadge(item.type);
              const TypeIcon = badge.icon;
              return (
                <div
                  key={item.id}
                  data-testid={`moderation-item-${item.id}`}
                  className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}
                      >
                        <TypeIcon className="h-3 w-3" />
                        <span>{badge.label}</span>
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {item.courseTitle}
                      </h3>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        مدرس: <span className="font-bold">{item.instructorName}</span>
                        {item.instructorEmail ? ` (${item.instructorEmail})` : ""}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold shrink-0 ${
                        item.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : item.status === "rejected"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {item.status === "approved" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> منتشر شده
                        </>
                      ) : item.status === "rejected" ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> رد شده
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5" /> در انتظار تأیید مدیر
                        </>
                      )}
                    </span>
                  </div>

                  <p className="rounded-xl border border-slate-300/80 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {item.summary}
                  </p>

                  {item.rejectionReason && item.status === "rejected" && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-700 dark:text-rose-300">
                      <span className="font-bold">دلیل رد شدن: </span>
                      {item.rejectionReason}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500">
                    تاریخ ارسال: {formatPersianDate(item.createdAt)}
                  </div>

                  <div className="space-y-2.5 border-t border-slate-300/80 dark:border-slate-800 pt-3">
                    <input
                      type="text"
                      value={rejectionNotes[item.id] ?? ""}
                      onChange={(e) =>
                        setRejectionNotes((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="یادداشت یا دلیل رد شدن (اختیاری برای دکمه رد کردن)..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid={`approve-content-${item.id}`}
                        disabled={
                          updatingId === item.id || item.status === "approved"
                        }
                        onClick={() => handleModerateContent(item.id, "approved")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تأیید و انتشار</span>
                      </button>
                      <button
                        type="button"
                        data-testid={`reject-content-${item.id}`}
                        disabled={
                          updatingId === item.id || item.status === "rejected"
                        }
                        onClick={() => handleModerateContent(item.id, "rejected")}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>رد کردن</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredInstructors.length === 0 ? (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-10 text-center text-xs text-slate-600 dark:text-slate-400">
          درخواست مدرسی در این وضعیت ثبت نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredInstructors.map((app) => (
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
                      <CheckCircle2 className="h-3.5 w-3.5" /> تأییدشده
                    </>
                  ) : app.status === "rejected" ? (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> ردشده
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5" /> در انتظار تأیید
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

              {app.rejectionReason && app.status === "rejected" && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-700 dark:text-rose-300">
                  <span className="font-bold">دلیل رد شدن: </span>
                  {app.rejectionReason}
                </div>
              )}

              <div className="space-y-2.5 border-t border-slate-300/80 dark:border-slate-800 pt-3">
                <input
                  type="text"
                  value={rejectionNotes[app.id] ?? ""}
                  onChange={(e) =>
                    setRejectionNotes((prev) => ({
                      ...prev,
                      [app.id]: e.target.value,
                    }))
                  }
                  placeholder="یادداشت یا دلیل رد درخواست (اختیاری)..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={updatingId === app.id || app.status === "approved"}
                    onClick={() => handleSetInstructorStatus(app.id, "approved")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تأیید و فعال‌سازی مدرس</span>
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === app.id || app.status === "rejected"}
                    onClick={() => handleSetInstructorStatus(app.id, "rejected")}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>رد کردن</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
