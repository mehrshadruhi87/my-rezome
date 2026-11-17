import React, { useEffect, useState } from "react";
import type { ChapterItem, LessonItem } from "../../types";
import { toPersianDigits } from "../../utils/formatters";
import { toast } from "sonner";
import {
  Check,
  Code2,
  Copy,
  Lock,
  Pause,
  Play,
  PlayCircle,
  X,
} from "lucide-react";

interface LessonPlayerModalProps {
  courseTitle: string;
  chapters: ChapterItem[];
  activeLesson: LessonItem;
  isEnrolled: boolean;
  onSelectLesson: (lesson: LessonItem) => void;
  onClose: () => void;
}

export function LessonPlayerModal({
  courseTitle,
  chapters,
  activeLesson,
  isEnrolled,
  onSelectLesson,
  onClose,
}: LessonPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(18);
  const [speed, setSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [activeLesson.id]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : Math.min(100, prev + speed * 1.2)));
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const handleCopyCode = () => {
    if (!activeLesson.codeSnippet) return;
    navigator.clipboard.writeText(activeLesson.codeSnippet);
    setCopied(true);
    toast.success("قطعه کد در حافظه کپی شد.");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`پخش‌کننده درس: ${activeLesson.title}`}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] text-indigo-400 truncate">{courseTitle}</p>
            <h2 className="text-sm font-bold text-white truncate">
              {activeLesson.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="بستن پخش‌کننده"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Split */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-3">
          {/* Player & Code Stage */}
          <div className="lg:col-span-2 flex flex-col border-b lg:border-b-0 lg:border-l border-slate-800">
            {activeLesson.videoUrl ? (
              <div className="relative aspect-video w-full bg-black">
                <video
                  src={activeLesson.videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="relative flex aspect-video w-full flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 p-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">
                    {activeLesson.isFree ? "پیش‌نمایش رایگان" : "دسترسی دانشجو"}
                  </span>
                  <span className="tabular-nums">مدت زمان: {activeLesson.duration}</span>
                </div>

                <div className="my-auto space-y-3 text-center">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    aria-label={isPlaying ? "توقف موقت" : "پخش درس"}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Play className="h-7 w-7" />
                    )}
                  </button>
                  <p className="mx-auto max-w-lg text-sm font-bold text-white">
                    {activeLesson.title}
                  </p>
                  <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-300">
                    {activeLesson.summary}
                  </p>
                </div>

                {/* Scrubber Controls */}
                <div className="space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 tabular-nums">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        className="font-semibold text-white hover:text-indigo-400"
                      >
                        {isPlaying ? "توقف" : "پخش"}
                      </button>
                      <span>{toPersianDigits(Math.round(progress))}٪ مشاهده شده</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {([1, 1.25, 1.5, 2] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSpeed(s)}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${
                            speed === s
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Code & Notes */}
            <div className="p-5 space-y-3 bg-slate-950/50 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Code2 className="h-4 w-4 text-indigo-400" />
                  <span>کد نمونه و نکات فنی جلسه</span>
                </div>
                {activeLesson.codeSnippet && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? "کپی شد" : "کپی کد"}</span>
                  </button>
                )}
              </div>

              {activeLesson.codeSnippet ? (
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-xs leading-relaxed text-emerald-300 font-mono"
                >
                  <code>{activeLesson.codeSnippet}</code>
                </pre>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeLesson.summary || "خلاصه آموزشی این جلسه در حال پخش است."}
                </p>
              )}
            </div>
          </div>

          {/* Playlist Sidebar */}
          <div className="overflow-y-auto p-4 space-y-4 bg-slate-900">
            <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
              سرفصل‌های دوره
            </h3>
            {chapters.map((ch) => (
              <div key={ch.id} className="space-y-1.5">
                <div className="text-xs font-bold text-indigo-400">
                  {ch.title}
                </div>
                <div className="space-y-1">
                  {ch.lessons.map((les) => {
                    const unlocked = les.isFree || isEnrolled;
                    const isCurrent = les.id === activeLesson.id;
                    return (
                      <button
                        key={les.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && onSelectLesson(les)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-xs transition-colors ${
                          isCurrent
                            ? "bg-indigo-600 text-white font-semibold"
                            : unlocked
                            ? "text-slate-300 hover:bg-slate-800"
                            : "text-slate-500 cursor-not-allowed opacity-70"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {unlocked ? (
                            <PlayCircle className="h-4 w-4 shrink-0" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{les.title}</span>
                        </div>
                        <span className="text-[11px] shrink-0 tabular-nums opacity-80">
                          {les.duration}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
