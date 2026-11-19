import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "../../router";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import {
  INTERACTIVE_ROADMAPS,
  computeTrackProgress,
  loadCompletedMilestones,
  saveCompletedMilestones,
} from "../../utils/interactiveCoding";
import { toPersianDigits } from "../../utils/formatters";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  FolderGit2,
  Layers,
} from "lucide-react";

export function InteractiveRoadmaps() {
  const { motionDuration } = useUserPreferences();
  const [selectedTrackId, setSelectedTrackId] = useState(
    INTERACTIVE_ROADMAPS[0].id
  );
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    loadCompletedMilestones()
  );

  const activeTrack =
    INTERACTIVE_ROADMAPS.find((t) => t.id === selectedTrackId) ??
    INTERACTIVE_ROADMAPS[0];

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    activeTrack.milestones[0].id
  );

  useEffect(() => {
    setSelectedMilestoneId(activeTrack.milestones[0].id);
  }, [activeTrack.id]);

  useEffect(() => {
    saveCompletedMilestones(completedIds);
  }, [completedIds]);

  const activeMilestone =
    activeTrack.milestones.find((m) => m.id === selectedMilestoneId) ??
    activeTrack.milestones[0];

  const progress = computeTrackProgress(activeTrack, completedIds);
  const isSelectedMilestoneDone = completedIds.includes(activeMilestone.id);

  const toggleMilestoneComplete = (milestoneId: string) => {
    setCompletedIds((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

  return (
    <motion.section
      id="roadmaps"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: motionDuration(0.45) }}
      className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
            <Compass className="h-4 w-4" />
            <span>مسیر استاندارد و تعاملی یادگیری</span>
          </span>
          <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            نقشه‌های راه تعاملی ورود به بازار کار
          </h2>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            مسیر تخصصی خود را انتخاب کنید، روی هر ایستگاه کلیک کنید تا مهارت‌ها و پروژه عملی آن را ببینید و پیشرفت خود را علامت بزنید.
          </p>
        </div>

        {/* Track Selector Tabs */}
        <div
          role="tablist"
          aria-label="انتخاب نقشه راه"
          className="flex flex-wrap gap-2"
        >
          {INTERACTIVE_ROADMAPS.map((track) => {
            const active = track.id === activeTrack.id;
            const trackProg = computeTrackProgress(track, completedIds);
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedTrackId(track.id)}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? "cyber-btn-glow border-[var(--accent-500)] bg-[var(--accent-600)] text-white"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)]/50 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-300)]"
                }`}
              >
                <span>{track.title}</span>
                <span
                  className={`mr-2 rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {toPersianDigits(trackProg.percent)}٪
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Split Workspace */}
      <div className="cyber-glow-card rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/85 dark:bg-slate-900/70 p-5 sm:p-7 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-black/30">
        {/* Track Header + Progress Bar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg bg-[var(--accent-500)]/15 px-2.5 py-1 font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                {activeTrack.duration}
              </span>
              <span className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-semibold text-slate-600 dark:text-slate-300">
                سطح: {activeTrack.level}
              </span>
            </div>
            <h3 className="mt-2.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {activeTrack.title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {activeTrack.subtitle}
            </p>
          </div>

          <div className="w-full sm:w-64 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold tabular-nums">
              <span className="text-slate-600 dark:text-slate-400">
                پیشرفت شما در این مسیر
              </span>
              <span
                data-testid="roadmap-progress-percent"
                className="text-[var(--accent-600)] dark:text-[var(--accent-400)]"
              >
                {toPersianDigits(progress.percent)}٪ (
                {toPersianDigits(progress.completed)} از{" "}
                {toPersianDigits(progress.total)})
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-[var(--accent-400)] to-[var(--accent-600)]"
                initial={false}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: motionDuration(0.35) }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Right: Interactive Milestone Timeline */}
          <div className="lg:col-span-6 space-y-3">
            {activeTrack.milestones.map((ms, index) => {
              const isDone = completedIds.includes(ms.id);
              const isSelected = ms.id === activeMilestone.id;
              return (
                <div
                  key={ms.id}
                  className={`group flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-[var(--accent-500)] bg-[var(--accent-500)]/10 shadow-md shadow-[var(--accent-500)]/10"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-[var(--accent-500)]/45"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMilestoneComplete(ms.id)}
                    aria-label={
                      isDone
                        ? `لغو تکمیل مرحله ${ms.title}`
                        : `علامت‌گذاری تکمیل مرحله ${ms.title}`
                    }
                    aria-pressed={isDone}
                    data-testid={`roadmap-toggle-${ms.id}`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      isDone
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:border-[var(--accent-500)] hover:text-[var(--accent-500)]"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMilestoneId(ms.id)}
                    className="flex-1 min-w-0 text-right"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] tabular-nums">
                        مرحله {toPersianDigits(index + 1)} · {ms.weeks}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isDone
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {isDone ? "تکمیل شده" : "در انتظار"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                      {ms.title}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Left: Selected Stage Inspector Card */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/75 p-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-500)]/15 px-2.5 py-1 text-xs font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{activeMilestone.weeks}</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleMilestoneComplete(activeMilestone.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                    isSelectedMilestoneDone
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[var(--accent-500)]"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isSelectedMilestoneDone
                      ? "تکمیل شد (کلیک برای لغو)"
                      : "علامت‌گذاری به عنوان تکمیل‌شده"}
                  </span>
                </button>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {activeMilestone.title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeMilestone.summary}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Layers className="h-4 w-4 text-[var(--accent-500)]" />
                  <span>مهارت‌ها و ابزارهای کلیدی</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeMilestone.skills.map((skill) => (
                    <span
                      key={skill}
                      dir="ltr"
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <FolderGit2 className="h-4 w-4" />
                  <span>پروژه عملی پایان مرحله</span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {activeMilestone.capstone}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                دوره‌های پیشنهادی مطابق با این مسیر
              </span>
              <Link
                href={`/courses?category=${activeTrack.categorySlug}`}
                className="cyber-btn-glow inline-flex items-center gap-2 rounded-xl bg-[var(--accent-600)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--accent-500)] transition-all"
              >
                <span>مشاهده دوره‌های این مسیر</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
