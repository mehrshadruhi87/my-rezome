import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { getDictionary } from "../../lib/i18n";
import {
  localizeChallenge,
  localizeRankInfo,
} from "../../lib/contentLocalization";
import {
  DAILY_CHALLENGES,
  type ChallengeEvaluationResult,
  type ChallengeProgressState,
  applyChallengeWin,
  evaluateChallengeSubmission,
  getDailyChallengesForDate,
  getRankInfo,
  getTodayDateKey,
  loadChallengeProgress,
  saveChallengeProgress,
} from "../../utils/interactiveCoding";
import { formatDigits } from "../../utils/formatters";
import {
  Award,
  Calendar,
  CheckCircle2,
  Flame,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

export function DailyChallengesSection() {
  const { motionDuration, language, isRtl } = useUserPreferences();
  const t = getDictionary(language);
  const isEn = language === "en";

  const todayKey = useMemo(() => getTodayDateKey(), []);
  const todaysChallenges = useMemo(
    () => getDailyChallengesForDate(todayKey, 4),
    [todayKey]
  );

  const [showAllPool, setShowAllPool] = useState(false);
  const rawVisibleChallenges = showAllPool
    ? DAILY_CHALLENGES
    : todaysChallenges;
  const visibleChallenges = useMemo(
    () => rawVisibleChallenges.map((c) => localizeChallenge(c, language)),
    [rawVisibleChallenges, language]
  );

  const [progress, setProgress] = useState<ChallengeProgressState>(() =>
    loadChallengeProgress()
  );
  const [activeId, setActiveId] = useState(todaysChallenges[0].id);
  const [codeByChallenge, setCodeByChallenge] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      DAILY_CHALLENGES.map((c) => [
        c.id,
        localizeChallenge(c, language).starterCode,
      ])
    )
  );
  const [showHint, setShowHint] = useState(false);
  const [evaluation, setEvaluation] =
    useState<ChallengeEvaluationResult | null>(null);

  useEffect(() => {
    setCodeByChallenge((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const raw of DAILY_CHALLENGES) {
        const faStarter = localizeChallenge(raw, "fa").starterCode;
        const enStarter = localizeChallenge(raw, "en").starterCode;
        const current = prev[raw.id];
        if (!current || current === faStarter || current === enStarter) {
          next[raw.id] = language === "en" ? enStarter : faStarter;
        }
      }
      return next;
    });
  }, [language]);

  useEffect(() => {
    saveChallengeProgress(progress);
  }, [progress]);

  const activeChallenge =
    visibleChallenges.find((c) => c.id === activeId) ?? visibleChallenges[0];
  const currentCode =
    codeByChallenge[activeChallenge.id] ?? activeChallenge.starterCode;
  const isSolved = progress.solvedIds.includes(activeChallenge.id);
  const rank = localizeRankInfo(getRankInfo(progress.xp), language);

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(isEn ? "en-US" : "fa-IR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
    } catch {
      return todayKey;
    }
  }, [todayKey, isEn]);

  const handleSelectChallenge = (id: string) => {
    setActiveId(id);
    setShowHint(false);
    setEvaluation(null);
  };

  const handleCodeChange = (nextCode: string) => {
    setCodeByChallenge((prev) => ({
      ...prev,
      [activeChallenge.id]: nextCode,
    }));
  };

  const handleFillSolution = () => {
    handleCodeChange(activeChallenge.solutionCode);
    setEvaluation(null);
  };

  const handleResetStarter = () => {
    handleCodeChange(activeChallenge.starterCode);
    setEvaluation(null);
  };

  const handleVerify = () => {
    const result = evaluateChallengeSubmission(activeChallenge, currentCode);
    setEvaluation(result);

    if (result.allPassed) {
      const { next, newlySolved } = applyChallengeWin(
        progress,
        activeChallenge,
        todayKey
      );
      if (newlySolved) {
        setProgress(next);
        toast.success(
          isEn
            ? `Well done! Solved "${activeChallenge.title}" and earned +${activeChallenge.xp} XP.`
            : `آفرین! چالش «${activeChallenge.title}» حل شد و ${formatDigits(
                activeChallenge.xp,
                language
              )} امتیاز XP دریافت کردید.`
        );
      } else {
        toast.info(
          isEn
            ? "All test cases passed! (XP for this challenge was already claimed.)"
            : "تمام تست‌ها با موفقیت پاس شدند (امتیاز این چالش قبلاً ثبت شده است)."
        );
      }
    } else {
      toast.error(
        result.runtimeError
          ? isEn
            ? `Execution error: ${result.runtimeError}`
            : `خطا در بررسی کد: ${result.runtimeError}`
          : isEn
            ? `${result.passedCount} of ${result.totalCount} tests passed. Review your code and retry.`
            : `${formatDigits(result.passedCount, language)} از ${formatDigits(
                result.totalCount,
                language
              )} تست پاس شد. کد را دوباره بررسی کنید.`
      );
    }
  };

  const difficultyBadgeClass = (diff: string) => {
    if (diff === "مبتدی") {
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
    if (diff === "متوسط") {
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    }
    return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  };

  return (
    <section
      id="challenges"
      className="scroll-mt-24 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10"
    >
      {/* Header + Gamified Scoreboard Strip */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              <Trophy className="h-4 w-4" />
              <span>{t.challenges.kicker}</span>
            </span>
            <span
              data-testid="daily-challenge-date"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#E9EFF6] dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300"
            >
              <Calendar className="h-3.5 w-3.5 text-[var(--accent-500)]" />
              <span>
                {isEn ? `Daily Pack · ${todayLabel}` : `بسته روزانه ${todayLabel}`}
              </span>
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {t.challenges.title}
          </h2>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-400">
            {t.challenges.subtitle}
          </p>
        </div>

        {/* Live XP / Rank / Streak Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:min-w-[440px]">
          <div
            className={`cyber-glow-card rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 px-3.5 py-3 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-500)]" />
              <span>{t.challenges.xpLabel}</span>
            </div>
            <div
              data-testid="challenges-xp-score"
              className="mt-1 text-lg font-black text-slate-900 dark:text-white tabular-nums"
            >
              {formatDigits(progress.xp, language)}{" "}
              <span className="text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                XP
              </span>
            </div>
          </div>

          <div
            className={`cyber-glow-card rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 px-3.5 py-3 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>{isEn ? "Your Rank" : "رتبه شما"}</span>
            </div>
            <div
              data-testid="challenges-rank-title"
              className="mt-1 text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate"
            >
              {rank.title}
            </div>
          </div>

          <div
            className={`cyber-glow-card rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 px-3.5 py-3 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>{isEn ? "Streak" : "استریک"}</span>
            </div>
            <div className="mt-1 text-lg font-black text-slate-900 dark:text-white tabular-nums">
              {formatDigits(progress.streak, language)}{" "}
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {isEn ? "days" : "روز"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Progress Bar + Pool Toggle */}
      <div className="mb-6 rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold tabular-nums">
          <span className="text-slate-800 dark:text-slate-300">
            {isEn ? "Solved Challenges:" : "چالش‌های حل‌شده:"}{" "}
            <strong className="text-[var(--accent-600)] dark:text-[var(--accent-400)]">
              {formatDigits(progress.solvedIds.length, language)}{" "}
              {isEn ? "of" : "از"}{" "}
              {formatDigits(DAILY_CHALLENGES.length, language)}
            </strong>
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-600 dark:text-slate-400">
              {t.challenges.nextRankPrefix}{" "}
              {isEn ? `"${rank.nextRankTitle}"` : `«${rank.nextRankTitle}»`}:{" "}
              {formatDigits(rank.progressPercent, language)}
              {isEn ? "%" : "٪"}
            </span>
            <button
              type="button"
              onClick={() => setShowAllPool((prev) => !prev)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:border-[var(--accent-500)] transition-colors"
            >
              {showAllPool
                ? isEn
                  ? "Show Today's Picks (4)"
                  : "نمایش چالش‌های منتخب امروز (۴)"
                : isEn
                  ? `View Full Archive (${DAILY_CHALLENGES.length})`
                  : `مشاهده کل آرشیو (${formatDigits(DAILY_CHALLENGES.length, language)})`}
            </button>
          </div>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-300 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-[var(--accent-500)]"
            initial={false}
            animate={{ width: `${rank.progressPercent}%` }}
            transition={{ duration: motionDuration(0.35) }}
          />
        </div>
      </div>

      {/* Main Challenges Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Challenge List */}
        <div className="lg:col-span-4 space-y-3 max-h-[540px] overflow-y-auto custom-lab-scroll pl-1">
          {visibleChallenges.map((challenge, idx) => {
            const active = challenge.id === activeChallenge.id;
            const solved = progress.solvedIds.includes(challenge.id);
            return (
              <button
                key={challenge.id}
                type="button"
                onClick={() => handleSelectChallenge(challenge.id)}
                data-testid={`challenge-item-${challenge.id}`}
                className={`w-full rounded-2xl border p-4 ${
                  isRtl ? "text-right" : "text-left"
                } transition-all ${
                  active
                    ? "cyber-glow-card border-[var(--accent-500)] bg-[var(--accent-500)]/12 shadow-lg"
                    : "border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 hover:border-[var(--accent-500)]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${difficultyBadgeClass(
                        challenge.difficulty
                      )}`}
                    >
                      {challenge.displayDifficulty}
                    </span>
                    {!showAllPool && idx === 0 && (
                      <span className="rounded-lg bg-[var(--accent-500)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                        {isEn ? "Featured Today" : "ویژه امروز"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[var(--accent-600)] dark:text-[var(--accent-400)] tabular-nums">
                      +{formatDigits(challenge.xp, language)} XP
                    </span>
                    {solved && (
                      <CheckCircle2
                        aria-label={t.challenges.solvedBadge}
                        className="h-4 w-4 text-emerald-500"
                      />
                    )}
                  </div>
                </div>
                <h3 className="mt-2.5 text-sm font-black text-slate-900 dark:text-white">
                  {challenge.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {challenge.category}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Challenge Workspace */}
        <div className="lg:col-span-8 cyber-glow-card overflow-hidden rounded-3xl border border-slate-300/90 dark:border-slate-800/90 bg-[#E9EFF6]/95 dark:bg-slate-900/75 shadow-xl shadow-slate-900/5 dark:shadow-black/30 backdrop-blur-xl">
          {/* Problem Brief */}
          <div className="border-b border-slate-300 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {activeChallenge.title}
                </h3>
                {isSolved && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t.challenges.solvedBadge}</span>
                  </span>
                )}
              </div>
              <span className="rounded-lg bg-[var(--accent-500)]/15 px-3 py-1 text-xs font-black text-[var(--accent-700)] dark:text-[var(--accent-300)] tabular-nums">
                {isEn ? "Reward:" : "جایزه:"} +
                {formatDigits(activeChallenge.xp, language)} XP
              </span>
            </div>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {activeChallenge.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-300 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>
                  {showHint ? t.challenges.hideHint : t.challenges.showHint}
                </span>
              </button>
              <button
                type="button"
                onClick={handleFillSolution}
                data-testid="challenge-fill-solution"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-300 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.challenges.showSolution}</span>
              </button>
              <button
                type="button"
                onClick={handleResetStarter}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.challenges.resetCode}</span>
              </button>
            </div>

            {showHint && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                <strong>{isEn ? "Hint: " : "راهنما: "}</strong>
                {activeChallenge.hint}
              </div>
            )}
          </div>

          {/* Code Input */}
          <div className="bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-[11px] text-slate-400">
              <span dir="ltr" className="font-mono">
                {activeChallenge.functionName}.js
              </span>
              <span className="font-sans">
                {isEn
                  ? 'Write your solution and click "Run Automated Tests"'
                  : "پاسخ خود را بنویسید و روی «اجرا و بررسی تست‌ها» کلیک کنید"}
              </span>
            </div>
            <textarea
              dir="ltr"
              aria-label={
                isEn
                  ? "Daily coding challenge editor"
                  : "ویرایشگر کد چالش روزانه"
              }
              data-testid="challenge-editor"
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              spellCheck={false}
              rows={8}
              className="custom-lab-scroll w-full resize-none bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 focus:outline-none"
            />
          </div>

          {/* Footer Action + Test Cases */}
          <div className="border-t border-slate-300 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-700 dark:text-slate-400 tabular-nums">
                {isEn
                  ? `Includes ${activeChallenge.testCases.length} automated validation tests`
                  : `شامل ${formatDigits(
                      activeChallenge.testCases.length,
                      language
                    )} تست خودکار اعتبارسنجی`}
              </div>
              <button
                type="button"
                onClick={handleVerify}
                data-testid="challenge-submit-btn"
                className="btn-3d inline-flex items-center gap-2 rounded-xl bg-[var(--accent-600)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--accent-500)] transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t.challenges.runTests}</span>
              </button>
            </div>

            {evaluation && (
              <div
                data-testid="challenge-results"
                className="space-y-2 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/75 p-4"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span
                    className={
                      evaluation.allPassed
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {evaluation.allPassed
                      ? t.challenges.allPassed
                      : isEn
                        ? `${evaluation.passedCount} of ${evaluation.totalCount} tests passed`
                        : `${formatDigits(
                            evaluation.passedCount,
                            language
                          )} از ${formatDigits(
                            evaluation.totalCount,
                            language
                          )} تست موفق`}
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono text-[11px] text-slate-500"
                  >
                    {evaluation.durationMs} ms
                  </span>
                </div>

                {evaluation.runtimeError ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-700 dark:text-rose-300">
                    {evaluation.runtimeError}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {evaluation.outcomes.map((item) => (
                      <div
                        key={item.label}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                          item.passed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          {item.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          )}
                          <span>{item.label}</span>
                        </div>
                        <div
                          dir="ltr"
                          className="font-mono text-[11px] opacity-90"
                        >
                          expected: {item.expected} | actual: {item.actual}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
