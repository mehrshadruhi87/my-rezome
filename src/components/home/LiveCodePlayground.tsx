import React, { useEffect, useMemo, useState } from "react";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { getDictionary } from "../../lib/i18n";
import {
  localizeHtmlCssTemplate,
  localizePlaygroundTemplate,
} from "../../lib/contentLocalization";
import {
  HTML_CSS_TEMPLATES,
  PLAYGROUND_TEMPLATES,
  type SandboxExecutionResult,
  buildHtmlCssPreviewDoc,
  runSandboxCode,
} from "../../utils/interactiveCoding";
import { formatDigits } from "../../utils/formatters";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  Play,
  RotateCcw,
  Terminal,
  Trash2,
} from "lucide-react";

type LabMode = "js" | "html-css";

export function LiveCodePlayground() {
  const { language, isRtl } = useUserPreferences();
  const t = getDictionary(language);
  const isEn = language === "en";

  const [mode, setMode] = useState<LabMode>("js");

  // JS Sandbox State
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    PLAYGROUND_TEMPLATES[0].id
  );
  const [code, setCode] = useState(
    () => localizePlaygroundTemplate(PLAYGROUND_TEMPLATES[0], language).code
  );
  const [result, setResult] = useState<SandboxExecutionResult | null>(() =>
    runSandboxCode(localizePlaygroundTemplate(PLAYGROUND_TEMPLATES[0], language).code)
  );

  // HTML & CSS Sandbox State
  const [selectedWebTplId, setSelectedWebTplId] = useState(
    HTML_CSS_TEMPLATES[0].id
  );
  const [htmlCode, setHtmlCode] = useState(HTML_CSS_TEMPLATES[0].html);
  const [cssCode, setCssCode] = useState(HTML_CSS_TEMPLATES[0].css);
  const [webEditorTab, setWebEditorTab] = useState<"html" | "css">("html");
  const [copied, setCopied] = useState(false);

  const localizedJsTemplates = useMemo(
    () =>
      PLAYGROUND_TEMPLATES.map((tpl) =>
        localizePlaygroundTemplate(tpl, language)
      ),
    [language]
  );

  const localizedWebTemplates = useMemo(
    () =>
      HTML_CSS_TEMPLATES.map((tpl) => localizeHtmlCssTemplate(tpl, language)),
    [language]
  );

  const activeTemplate =
    localizedJsTemplates.find((tpl) => tpl.id === selectedTemplateId) ??
    localizedJsTemplates[0];
  const activeWebTemplate =
    localizedWebTemplates.find((tpl) => tpl.id === selectedWebTplId) ??
    localizedWebTemplates[0];

  // Keep starter template code localized when user toggles FA <-> EN
  useEffect(() => {
    const raw = PLAYGROUND_TEMPLATES.find((tpl) => tpl.id === selectedTemplateId);
    if (!raw) return;
    const faCode = localizePlaygroundTemplate(raw, "fa").code;
    const enCode = localizePlaygroundTemplate(raw, "en").code;
    setCode((prev) => {
      if (prev === faCode || prev === enCode) {
        const nextCode = language === "en" ? enCode : faCode;
        setResult(runSandboxCode(nextCode));
        return nextCode;
      }
      return prev;
    });
  }, [language, selectedTemplateId]);

  const activeCodeText =
    mode === "js" ? code : webEditorTab === "html" ? htmlCode : cssCode;

  const lineCount = useMemo(
    () => Math.max(16, activeCodeText.split("\n").length),
    [activeCodeText]
  );

  const htmlPreviewSrcDoc = useMemo(
    () => buildHtmlCssPreviewDoc(htmlCode, cssCode),
    [htmlCode, cssCode]
  );

  const handleSelectJsTemplate = (templateId: string) => {
    const next = localizedJsTemplates.find((tpl) => tpl.id === templateId);
    if (!next) return;
    setSelectedTemplateId(next.id);
    setCode(next.code);
    setResult(runSandboxCode(next.code));
  };

  const handleSelectWebTemplate = (templateId: string) => {
    const next = HTML_CSS_TEMPLATES.find((tpl) => tpl.id === templateId);
    if (!next) return;
    setSelectedWebTplId(next.id);
    setHtmlCode(next.html);
    setCssCode(next.css);
  };

  const handleRunJs = () => {
    setResult(runSandboxCode(code));
  };

  const handleReset = () => {
    if (mode === "js") {
      setCode(activeTemplate.code);
      setResult(runSandboxCode(activeTemplate.code));
    } else {
      setHtmlCode(activeWebTemplate.html);
      setCssCode(activeWebTemplate.css);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        mode === "js"
          ? code
          : `<!-- HTML -->\n${htmlCode}\n\n/* CSS */\n${cssCode}`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <section
      id="playground"
      className="scroll-mt-24 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10"
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
            <Terminal className="h-4 w-4" />
            <span>{t.codeLab.kicker}</span>
          </span>
          <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {t.codeLab.title}
          </h2>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-400">
            {t.codeLab.subtitle}
          </p>
        </div>

        {/* Mode Switcher: JavaScript vs HTML & CSS */}
        <div className="inline-flex rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900 p-1.5 self-start lg:self-auto">
          <button
            type="button"
            data-testid="lab-mode-js"
            onClick={() => setMode("js")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
              mode === "js"
                ? "btn-3d bg-[var(--accent-600)] text-white"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>JavaScript</span>
          </button>
          <button
            type="button"
            data-testid="lab-mode-html-css"
            onClick={() => setMode("html-css")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
              mode === "html-css"
                ? "btn-3d bg-[var(--accent-600)] text-white"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{isEn ? "Live HTML & CSS" : "HTML & CSS زنده"}</span>
          </button>
        </div>
      </div>

      {/* Template Selector Strip (Swipeable on mobile) */}
      <div className="mb-4 flex overflow-x-auto no-scrollbar gap-2 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:flex-wrap">
        {mode === "js"
          ? localizedJsTemplates.map((tpl) => {
              const active = tpl.id === selectedTemplateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectJsTemplate(tpl.id)}
                  className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    active
                      ? "border-[var(--accent-500)] bg-[var(--accent-600)] text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 text-slate-800 dark:text-slate-300 hover:border-[var(--accent-500)]/50"
                  }`}
                >
                  {tpl.title}
                </button>
              );
            })
          : localizedWebTemplates.map((tpl) => {
              const active = tpl.id === selectedWebTplId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectWebTemplate(tpl.id)}
                  className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    active
                      ? "border-[var(--accent-500)] bg-[var(--accent-600)] text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 text-slate-800 dark:text-slate-300 hover:border-[var(--accent-500)]/50"
                  }`}
                >
                  {tpl.title}
                </button>
              );
            })}
      </div>

      {/* Split Sandbox Frame */}
      <div className="cyber-glow-card overflow-hidden rounded-3xl border border-slate-300/90 dark:border-slate-800/90 bg-[#E9EFF6]/95 dark:bg-slate-900/75 shadow-xl shadow-slate-900/5 dark:shadow-black/35 backdrop-blur-xl">
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-950/80 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-lg bg-[var(--accent-500)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)] shrink-0">
              {mode === "js" ? activeTemplate.badge : activeWebTemplate.badge}
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-400 truncate">
              {mode === "js"
                ? activeTemplate.description
                : activeWebTemplate.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-300 hover:border-[var(--accent-500)]/60 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.codeLab.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t.codeLab.copy}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-300 hover:border-[var(--accent-500)]/60 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.codeLab.reset}</span>
            </button>
            {mode === "js" && (
              <button
                type="button"
                onClick={handleRunJs}
                data-testid="playground-run-btn"
                className="btn-3d inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-600)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--accent-500)] transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t.codeLab.runCode}</span>
              </button>
            )}
          </div>
        </div>

        {/* Two-Zone Split Pane with Working Custom Scrollbars */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Code Editor Pane */}
          <div
            className={`${
              mode === "html-css" ? "lg:col-span-6" : "lg:col-span-7"
            } border-b lg:border-b-0 ${
              isRtl ? "lg:border-l" : "lg:border-r"
            } border-slate-300 dark:border-slate-800 bg-slate-950 flex flex-col`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/90 px-4 py-2 text-[11px] text-slate-400">
              {mode === "js" ? (
                <>
                  <span dir="ltr" className="font-mono">
                    sandbox.js · ES2023
                  </span>
                  <span className="font-sans">
                    <kbd dir="ltr" className="font-mono text-slate-300">
                      Ctrl + Enter
                    </kbd>{" "}
                    {isEn ? "to run" : "برای اجرا"}
                  </span>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid="lab-tab-html"
                      onClick={() => setWebEditorTab("html")}
                      className={`rounded-lg px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                        webEditorTab === "html"
                          ? "bg-[var(--accent-600)] text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      index.html
                    </button>
                    <button
                      type="button"
                      data-testid="lab-tab-css"
                      onClick={() => setWebEditorTab("css")}
                      className={`rounded-lg px-3 py-1 font-mono text-[11px] font-bold transition-colors ${
                        webEditorTab === "css"
                          ? "bg-[var(--accent-600)] text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      styles.css
                    </button>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-sans">
                    {isEn ? "Auto live refresh" : "به‌روزرسانی زنده خودکار"}
                  </span>
                </div>
              )}
            </div>

            <div
              dir="ltr"
              className="custom-lab-scroll flex h-[430px] overflow-y-auto overflow-x-auto"
            >
              <div
                aria-hidden="true"
                className="select-none border-r border-slate-800/80 bg-slate-950 px-3 py-4 text-right font-mono text-xs leading-6 text-slate-600 tabular-nums shrink-0"
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i + 1}>{i + 1}</div>
                ))}
              </div>
              {mode === "js" ? (
                <textarea
                  dir="ltr"
                  aria-label={
                    isEn
                      ? "Live Code Lab JavaScript Editor"
                      : "ویرایشگر کد جاوااسکریپت آزمایشگاه زنده"
                  }
                  data-testid="playground-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleRunJs();
                    }
                  }}
                  spellCheck={false}
                  rows={lineCount}
                  className="w-full min-h-full resize-none bg-transparent p-4 text-left font-mono text-xs leading-6 text-slate-100 focus:outline-none overflow-hidden"
                />
              ) : webEditorTab === "html" ? (
                <textarea
                  dir="ltr"
                  aria-label={
                    isEn
                      ? "Live Code Lab HTML Editor"
                      : "ویرایشگر کد HTML آزمایشگاه زنده"
                  }
                  data-testid="playground-html-editor"
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  spellCheck={false}
                  rows={lineCount}
                  className="w-full min-h-full resize-none bg-transparent p-4 text-left font-mono text-xs leading-6 text-sky-100 focus:outline-none overflow-hidden"
                />
              ) : (
                <textarea
                  dir="ltr"
                  aria-label={
                    isEn
                      ? "Live Code Lab CSS Editor"
                      : "ویرایشگر کد CSS آزمایشگاه زنده"
                  }
                  data-testid="playground-css-editor"
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  spellCheck={false}
                  rows={lineCount}
                  className="w-full min-h-full resize-none bg-transparent p-4 text-left font-mono text-xs leading-6 text-emerald-100 focus:outline-none overflow-hidden"
                />
              )}
            </div>
          </div>

          {/* Output or Live HTML/CSS Preview Pane */}
          {mode === "js" ? (
            <div className="lg:col-span-5 flex flex-col bg-[#F1F5F9] dark:bg-slate-950/75">
              <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 px-4 py-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {result ? (
                    result.ok ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isEn ? "Executed" : "اجرا موفق"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{isEn ? "Runtime Error" : "خطای اجرا"}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-slate-600 dark:text-slate-500">
                      {isEn ? "Ready to Run" : "آماده اجرا"}
                    </span>
                  )}
                  {result && (
                    <span
                      dir="ltr"
                      className="rounded-md bg-slate-200 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-300 tabular-nums"
                    >
                      {result.durationMs} ms
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  aria-label={t.codeLab.clear}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isEn ? "Clear" : "پاک‌سازی"}</span>
                </button>
              </div>

              <div
                data-testid="playground-output"
                className="custom-lab-scroll h-[430px] overflow-y-auto p-4 space-y-2 font-sans text-xs"
              >
                {!result ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-600 dark:text-slate-400">
                    <Terminal className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">{t.codeLab.readyHint}</p>
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
                              : "border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/90 text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        <span
                          className={`${isRtl ? "ml-2" : "mr-2"} text-[10px] font-bold text-slate-500 tabular-nums`}
                        >
                          [{formatDigits(idx + 1, language)}]
                        </span>
                        <span className="break-words">{entry.text}</span>
                      </div>
                    ))}

                    {result.returnValue !== undefined && (
                      <div className="rounded-xl border border-[var(--accent-500)]/35 bg-[var(--accent-500)]/12 px-3 py-2 text-[var(--accent-800)] dark:text-[var(--accent-200)]">
                        <span
                          className={`font-sans text-[11px] font-bold ${isRtl ? "ml-2" : "mr-2"}`}
                        >
                          {t.codeLab.returnVal}
                        </span>
                        <span dir="ltr" className="break-all font-mono">
                          {result.returnValue}
                        </span>
                      </div>
                    )}

                    {result.error && (
                      <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-rose-700 dark:text-rose-300">
                        <div className="font-sans text-[11px] font-bold mb-1">
                          {isEn ? "Error message:" : "پیام خطا:"}
                        </div>
                        <div dir="ltr" className="font-mono">
                          {result.error}
                        </div>
                      </div>
                    )}

                    {result.ok &&
                      result.logs.length === 0 &&
                      result.returnValue === undefined && (
                        <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-3 font-sans text-xs text-slate-600 dark:text-slate-400">
                          {isEn
                            ? "Code executed cleanly without console.log output."
                            : "کد بدون خطا اجرا شد اما خروجی با console.log ثبت نکرد."}
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-6 flex flex-col bg-[#F1F5F9] dark:bg-slate-950/90">
              <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.codeLab.previewTitle}</span>
                </span>
                <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                  {isEn ? "Interactive & scrollable" : "قابل اسکرول و تعاملی"}
                </span>
              </div>
              <div className="custom-lab-scroll h-[430px] overflow-auto bg-slate-900">
                <iframe
                  title={t.codeLab.previewTitle}
                  data-testid="playground-html-preview"
                  sandbox="allow-same-origin"
                  srcDoc={htmlPreviewSrcDoc}
                  className="h-full w-full min-h-[420px] border-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
