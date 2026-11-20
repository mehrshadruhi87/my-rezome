import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import type {
  ChapterItem,
  CourseDetail,
  CourseSummary,
  LessonAttachmentItem,
} from "../../types";
import { toPersianDigits } from "../../utils/formatters";
import { toast } from "sonner";
import {
  Clock,
  Download,
  FileUp,
  Film,
  Paperclip,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

interface AdminMediaUploadManagerProps {
  courses: CourseSummary[];
  onSaved: () => Promise<void> | void;
}

export function AdminMediaUploadManager({
  courses,
  onSaved,
}: AdminMediaUploadManagerProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ""
  );
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // New URL attachment quick inputs
  const [attTitle, setAttTitle] = useState("");
  const [attUrl, setAttUrl] = useState("");
  const [attSize, setAttSize] = useState("2.4 MB");

  useEffect(() => {
    if (!selectedCourseId && courses[0]?.id) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    let active = true;
    setLoadingCourse(true);
    apiRequest<{ course: CourseDetail }>(`/api/admin/courses/${selectedCourseId}`)
      .then((res) => {
        if (!active) return;
        setCourseDetail(res.course);
        const chs = res.course.chapters || [];
        setChapters(chs);
        if (chs[0]) {
          setSelectedChapterId(chs[0].id);
          setSelectedLessonId(chs[0].lessons[0]?.id || "");
        } else {
          setSelectedChapterId("");
          setSelectedLessonId("");
        }
      })
      .catch(() => {
        if (active) {
          setCourseDetail(null);
          setChapters([]);
        }
      })
      .finally(() => {
        if (active) setLoadingCourse(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  const currentChapter = chapters.find((c) => c.id === selectedChapterId);
  const currentLesson = currentChapter?.lessons.find(
    (l) => l.id === selectedLessonId
  );

  const updateCurrentLesson = (
    updater: (lesson: NonNullable<typeof currentLesson>) => NonNullable<typeof currentLesson>
  ) => {
    if (!currentChapter || !currentLesson) return;
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id !== currentChapter.id
          ? ch
          : {
              ...ch,
              lessons: ch.lessons.map((les) =>
                les.id === currentLesson.id ? updater(les) : les
              ),
            }
      )
    );
  };

  const handleUploadVideoFile = async (file: File) => {
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "videos");
      const res = await apiRequest<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData,
      });
      updateCurrentLesson((les) => ({ ...les, videoUrl: res.url }));
      toast.success("ویدیو با موفقیت آپلود و به جلسه متصل شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در آپلود ویدیو");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleUploadAttachmentFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "attachments");
      const res = await apiRequest<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const sizeKb = file.size / 1024;
      const readableSize =
        sizeKb > 1024
          ? `${(sizeKb / 1024).toFixed(1)} MB`
          : `${Math.max(1, Math.round(sizeKb))} KB`;
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      const nextAtt: LessonAttachmentItem = {
        id: `att_${Date.now()}`,
        title: file.name,
        fileUrl: res.url,
        fileType: ext,
        fileSize: readableSize,
      };
      updateCurrentLesson((les) => ({
        ...les,
        attachments: [...(les.attachments || []), nextAtt],
      }));
      toast.success(`فایل «${file.name}» به ضمیمه‌های جلسه اضافه شد.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در آپلود فایل");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddAttachmentByUrl = () => {
    if (!attTitle.trim() || !attUrl.trim()) {
      toast.error("عنوان و لینک دانلود فایل را وارد کنید.");
      return;
    }
    const nextAtt: LessonAttachmentItem = {
      id: `att_${Date.now()}`,
      title: attTitle.trim(),
      fileUrl: attUrl.trim(),
      fileType: attUrl.split(".").pop()?.slice(0, 5).toUpperCase() || "FILE",
      fileSize: attSize.trim() || undefined,
    };
    updateCurrentLesson((les) => ({
      ...les,
      attachments: [...(les.attachments || []), nextAtt],
    }));
    setAttTitle("");
    setAttUrl("");
    toast.success("فایل ضمیمه اضافه شد. برای ثبت نهایی دکمه ذخیره را بزنید.");
  };

  const handleRemoveAttachment = (attId: string) => {
    updateCurrentLesson((les) => ({
      ...les,
      attachments: (les.attachments || []).filter((a) => a.id !== attId),
    }));
  };

  const handleSaveMediaChanges = async () => {
    if (!courseDetail) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ pendingApproval?: boolean }>(
        `/api/admin/courses/${courseDetail.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...courseDetail,
            categoryId: courseDetail.category?.id,
            chapters,
          }),
        }
      );
      if (res.pendingApproval || !isAdmin) {
        toast.success(
          "ویدیوها و فایل‌های ضمیمه ذخیره شد و با وضعیت «در انتظار تأیید مدیر» در صف انتشار قرار گرفت."
        );
      } else {
        toast.success("ویدیوها و فایل‌های ضمیمه دوره با موفقیت ذخیره و منتشر شدند.");
      }
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره فایل‌ها");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            تمام ویدیوها و فایل‌های آپلودشده توسط مدرسین با وضعیت{" "}
            <strong>«در انتظار تأیید مدیر»</strong> ثبت می‌شوند و بلافاصله پس از تأیید مدیر کل در سایت منتشر خواهند شد.
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Film className="h-5 w-5 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
            <span>مدیریت آپلود ویدیو و فایل‌های ضمیمه جلسات</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            برای هر جلسه از دوره‌ها، ویدیوی آموزشی آپلود کنید و جزوه، سورس‌کد (ZIP/PDF) یا فایل تمرینی قابل دانلود پیوست نمایید.
          </p>
        </div>
        <button
          type="button"
          disabled={saving || !courseDetail}
          onClick={handleSaveMediaChanges}
          className="btn-3d inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shrink-0 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "در حال ذخیره..." : "ذخیره تغییرات مدیا"}</span>
        </button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 p-4 space-y-2">
          <label
            htmlFor="media-course-select"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            ۱. انتخاب دوره
          </label>
          <select
            id="media-course-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 p-4 space-y-2">
          <label
            htmlFor="media-chapter-select"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            ۲. انتخاب فصل ({toPersianDigits(chapters.length)} فصل)
          </label>
          <select
            id="media-chapter-select"
            value={selectedChapterId}
            onChange={(e) => {
              const chId = e.target.value;
              setSelectedChapterId(chId);
              const ch = chapters.find((x) => x.id === chId);
              setSelectedLessonId(ch?.lessons[0]?.id || "");
            }}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white"
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 p-4 space-y-2">
          <label
            htmlFor="media-lesson-select"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            ۳. انتخاب جلسه
          </label>
          <select
            id="media-lesson-select"
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white"
          >
            {(currentChapter?.lessons || []).map((les) => (
              <option key={les.id} value={les.id}>
                {les.title} ({les.duration})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingCourse ? (
        <div className="h-56 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse" />
      ) : !currentLesson ? (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-8 text-center text-xs text-slate-600 dark:text-slate-400">
          این دوره هنوز جلسه‌ای ندارد. از بخش «دوره‌ها» ابتدا سرفصل و جلسه اضافه کنید.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Video Manager */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <Video className="h-4 w-4 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
                <span>ویدیوی جلسه: {currentLesson.title}</span>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--accent-600)] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[var(--accent-500)] transition-colors">
                <Upload className="h-3.5 w-3.5" />
                <span>
                  {uploadingVideo ? "در حال آپلود..." : "آپلود فایل ویدیو"}
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  className="hidden"
                  disabled={uploadingVideo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadVideoFile(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div>
              <label
                htmlFor="lesson-video-url"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                لینک مستقیم ویدیو (MP4 / WebM / Stream URL)
              </label>
              <input
                id="lesson-video-url"
                type="text"
                dir="ltr"
                value={currentLesson.videoUrl || ""}
                onChange={(e) =>
                  updateCurrentLesson((les) => ({
                    ...les,
                    videoUrl: e.target.value,
                  }))
                }
                placeholder="https://cdn.example.com/lesson-01.mp4"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            {currentLesson.videoUrl ? (
              <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-800 bg-black aspect-video">
                <video
                  src={currentLesson.videoUrl}
                  controls
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-400 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950/60 text-xs text-slate-500">
                هنوز ویدیویی برای این جلسه بارگذاری نشده است.
              </div>
            )}
          </div>

          {/* Downloadable Attachments Manager */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <Paperclip className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>فایل‌های قابل دانلود جلسه</span>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors">
                <FileUp className="h-3.5 w-3.5" />
                <span>
                  {uploadingFile ? "در حال آپلود..." : "آپلود فایل ضمیمه"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadAttachmentFile(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            {/* Add attachment by URL */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <input
                type="text"
                value={attTitle}
                onChange={(e) => setAttTitle(e.target.value)}
                placeholder="عنوان فایل (مثلاً سورس پروژه فصل ۱)"
                className="sm:col-span-5 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                dir="ltr"
                value={attUrl}
                onChange={(e) => setAttUrl(e.target.value)}
                placeholder="https://.../starter.zip"
                className="sm:col-span-5 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddAttachmentByUrl}
                className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-[var(--accent-600)] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            {/* Existing attachments list */}
            <div className="space-y-2">
              {(currentLesson.attachments || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-400 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950/60 p-6 text-center text-xs text-slate-500">
                  فایل ضمیمه‌ای برای این جلسه ثبت نشده است.
                </div>
              ) : (
                (currentLesson.attachments || []).map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/70 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {att.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {att.fileType || "FILE"}
                          {att.fileSize ? ` · ${att.fileSize}` : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`حذف فایل ${att.title}`}
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
