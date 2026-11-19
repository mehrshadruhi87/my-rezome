import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import {
  PLAYGROUND_TEMPLATES,
  type SandboxExecutionResult,
  runSandboxCode,
} from "../../utils/interactiveCoding";
import { toPersianDigits } from "../../utils/formatters";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Play,
  RotateCcw,
  Terminal,
  Trash2,
} from "lucide-react";

export function LiveCodePlayground() {
  const { motionDuration } = useUserPreferences();
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    PLAYGROUND_TEMPLATES[0].id
  );
  const [code, setCode] = useState(PLAYGROUND_TEMPLATES[0].code);
  const [result, setResult] = useState<SandboxExecutionResult | null>(() =>
    runSandboxCode(PLAYGROUND_TEMPLATES[0].code)
  );
  const [copied, setCopied] = useState(false);

  const activeTemplate =
    PLAYGROUND_TEMPLATES.find((t) => t.id === selectedTemplateId) ??
    PLAYGROUND_TEMPLATES[0];

  const lineCount = useMemo(() => Math.max(12, code.split("\n").length), [code]);

  const handleSelectTemplate = (templateId: string) => {
    const next = PLAYGROUND_TEMPLATES.find((t) => t.id === templateId);
    if (!next) return;
    setSelectedTemplateId(next.id);
    setCode(next.code);
    setResult(runSandboxCode(next.code));
  };

  const handleRun = () => {
    setResult(runSandboxCode(code));
  };

  const handleReset = () => {
    setCode(activeTemplate.code);
    setResult(runSandboxCode(activeTemplate.code));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <motion.section
      id="playground"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: motionDuration(0.45) }}
      className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
            <Terminal className="h-4 w-4" />
            <span>محیط اجرای مستقیم در مرورگر</span>
          </span>
          <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            آزمایشگاه اجرای زنده کد (Live Playground)
          </h2>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            کدهای JavaScript را مستقیماً ویرایش کنید، الگوریتم‌ها را تست بگیرید و خروجی کنسول و زمان اجرا را به‌صورت لحظه‌ای مشاهده کنید.
          </p>
        </div>

        {/* Template Selector */}
        <div className="flex flex-wrap gap-2">
          {PLAYGROUND_TEMPLATES.map((tpl) => {
            const active = tpl.id === selectedTemplateId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  active
                    ? "cyber-btn-glow border-[var(--accent-500)] bg-[var(--accent-600)] text-white"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)]/50"
                }`}
              >
                {tpl.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Sandbox Frame */}
      <div className="cyber-glow-card overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/75 shadow-xl shadow-slate-900/5 dark:shadow-black/35 backdrop-blur-xl">
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/80 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-lg bg-[var(--accent-500)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)] shrink-0">
              {activeTemplate.badge}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {activeTemplate.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)]/60 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>کپی</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)]/60 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>بازنشانی</span>
            </button>
            <button
              type="button"
              onClick={handleRun}
              data-testid="playground-run-btn"
              className="cyber-btn-glow inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-600)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--accent-500)] transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>اجرای کد</span>
            </button>
          </div>
        </div>

        {/* Two-Zone Editor & Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Code Editor Pane (7 cols) */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800/90 px-4 py-2 text-[11px] text-slate-400">
              <span dir="ltr" className="font-mono">
                sandbox.js · ES2023
              </span>
              <span className="font-sans">
                <kbd dir="ltr" className="font-mono text-slate-300">
                  Ctrl + Enter
                </kbd>{" "}
                برای اجرا
              </span>
            </div>
            <div dir="ltr" className="flex min-h-[300px] max-h-[360px] overflow-auto">
              <div
                aria-hidden="true"
                className="select-none border-r border-slate-800/80 bg-slate-950 px-3 py-4 text-right font-mono text-xs leading-6 text-slate-600 tabular-nums"
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i + 1}>{i + 1}</div>
                ))}
              </div>
              <textarea
                aria-label="ویرایشگر کد آزمایشگاه زنده"
                data-testid="playground-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleRun();
                  }
                }}
                spellCheck={false}
                className="min-h-[300px] w-full resize-none bg-transparent p-4 font-mono text-xs leading-6 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Console Output Pane (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-50/90 dark:bg-slate-950/75">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                {result ? (
                  result.ok ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>اجرا موفق</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>خطای اجرا</span>
                    </span>
                  )
                ) : (
                  <span className="text-slate-500">آماده اجرا</span>
                )}
                {result && (
                  <span
                    dir="ltr"
                    className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums"
                  >
                    {result.durationMs} ms
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setResult(null)}
                aria-label="پاک کردن خروجی کنسول"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>پاک‌سازی</span>
              </button>
            </div>

            <div
              data-testid="playground-output"
              className="flex-1 min-h-[260px] max-h-[360px] overflow-y-auto p-4 space-y-2 font-sans text-xs"
            >
              {!result ? (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 font-sans">
                  <Terminal className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">
                    دکمه «اجرای کد» را بزنید تا خروجی اینجا نمایش داده شود.
                  </p>
                </div>
              ) : (
                <>
                  {result.logs.map((entry, idx) => (
                    <div
                      key={`${idx}-${entry.text.slice(0, 12)}`}
                      className={`rounded-xl border px-3 py-2 leading-relaxed ${
                        entry.level === "error"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : entry.level === "warn"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      <span className="ml-2 text-[10px] font-bold text-slate-400 tabular-nums">
                        [{toPersianDigits(idx + 1)}]
                      </span>
                      <span className="break-words">{entry.text}</span>
                    </div>
                  ))}

                  {result.returnValue !== undefined && (
                    <div className="rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 px-3 py-2 text-[var(--accent-800)] dark:text-[var(--accent-200)]">
                      <span className="font-sans text-[11px] font-bold ml-2">
                        مقدار بازگشتی:
                      </span>
                      <span dir="ltr" className="break-all">
                        {result.returnValue}
                      </span>
                    </div>
                  )}

                  {result.error && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-rose-700 dark:text-rose-300">
                      <div className="font-sans text-[11px] font-bold mb-1">
                        پیام خطا:
                      </div>
                      <div dir="ltr">{result.error}</div>
                    </div>
                  )}

                  {result.ok &&
                    result.logs.length === 0 &&
                    result.returnValue === undefined && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 font-sans text-xs text-slate-500 dark:text-slate-400">
                        کد بدون خطا اجرا شد اما خروجی با console.log ثبت نکرد.
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
