import React, { useCallback, useEffect, useState } from "react";
import { Link } from "../../router";
import { apiRequest } from "../../lib/api";
import { useUserPreferences } from "../../context/UserPreferencesContext";
import { getDictionary } from "../../lib/i18n";
import { localizeNewsArticle } from "../../lib/contentLocalization";
import {
  CODEACADEMY_REALTIME_EVENT,
  type RealtimeSyncEventDetail,
} from "../../lib/realtimeSync";
import { formatDigits, formatPersianDate } from "../../utils/formatters";
import type { NewsArticle } from "../../types";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Newspaper,
  User,
  X,
} from "lucide-react";

interface NewsSectionProps {
  compact?: boolean;
}

export function NewsSection({ compact = false }: NewsSectionProps) {
  const { language, isRtl } = useUserPreferences();
  const t = getDictionary(language);
  const DirArrow = isRtl ? ArrowLeft : ArrowRight;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("__ALL__");
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    try {
      const res = await apiRequest<{ news: NewsArticle[] }>("/api/news");
      setArticles(res.news || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<RealtimeSyncEventDetail>).detail;
      if (!detail || detail.table === "news") {
        void loadNews();
      }
    };
    window.addEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    return () => {
      window.removeEventListener(CODEACADEMY_REALTIME_EVENT, onRealtime);
    };
  }, [loadNews]);

  const localizedArticles = articles.map((a) =>
    localizeNewsArticle(a, language)
  );

  const categories = [
    "__ALL__",
    ...Array.from(
      new Set(localizedArticles.map((a) => a.category).filter(Boolean))
    ),
  ];

  const filtered =
    selectedCategory === "__ALL__"
      ? localizedArticles
      : localizedArticles.filter((a) => a.category === selectedCategory);

  const visibleArticles = compact ? filtered.slice(0, 3) : filtered;
  const activeArticle =
    localizedArticles.find((a) => a.id === activeArticleId) ?? null;

  return (
    <section
      id="tech-news"
      className="scroll-mt-24 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
            <Newspaper className="h-4 w-4" />
            <span>{t.news.kicker}</span>
          </span>
          <h2 className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            {t.news.title}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {t.news.subtitle}
          </p>
        </div>

        {compact ? (
          <Link
            href="/news"
            data-testid="news-archive-cta"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 self-start sm:self-auto"
          >
            <span>{t.news.archiveBtn}</span>
            <DirArrow className="h-4 w-4" />
          </Link>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  selectedCategory === cat
                    ? "bg-[var(--accent-600)] text-white"
                    : "border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-[#DFE7F2] dark:hover:bg-slate-800"
                }`}
              >
                {cat === "__ALL__" ? t.news.allCategory : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-60 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse"
            />
          ))}
        </div>
      ) : visibleArticles.length === 0 ? (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-10 text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.news.empty}
          </p>
        </div>
      ) : (
        <div
          className={
            compact
              ? "flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 -mx-4 px-4 no-scrollbar md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6"
              : "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          }
        >
          {visibleArticles.map((article) => (
            <article
              key={article.id}
              className={`cyber-glow-card flex flex-col justify-between rounded-2xl border border-slate-300/90 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-6 transition-all hover:-translate-y-1 ${
                compact
                  ? "w-[84vw] max-w-[340px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink"
                  : ""
              }`}
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2 text-[11px]">
                  <span className="rounded-lg border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/12 px-2.5 py-1 font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 tabular-nums">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatPersianDate(article.createdAt, language)}
                  </span>
                </div>

                <h3 className="text-base font-black leading-snug text-slate-900 dark:text-white line-clamp-2">
                  {article.title}
                </h3>

                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                  {article.summary}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-300/80 dark:border-slate-800 pt-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <User className="h-3.5 w-3.5 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
                  {article.authorName}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveArticleId(article.id)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:underline underline-offset-4"
                >
                  <span>{t.news.readMore}</span>
                  <DirArrow className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!compact && articles.length > 0 && (
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {t.news.showingPrefix}{" "}
          {formatDigits(visibleArticles.length, language)}{" "}
          {t.news.showingMiddle} {formatDigits(articles.length, language)}{" "}
          {t.news.showingSuffix}
        </div>
      )}

      {/* Full Article Modal */}
      {activeArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeArticle.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setActiveArticleId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-300 dark:border-slate-800 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="rounded-md bg-[var(--accent-500)]/15 px-2.5 py-0.5 font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                    {activeArticle.category}
                  </span>
                  <span>·</span>
                  <span>
                    {formatPersianDate(activeArticle.createdAt, language)}
                  </span>
                  <span>·</span>
                  <span>
                    {t.news.authorLabel} {activeArticle.authorName}
                  </span>
                </div>
                <h3 className="mt-2 text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label={language === "en" ? "Close article" : "بستن خبر"}
                onClick={() => setActiveArticleId(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-[#E2E8F0] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="rounded-xl border border-slate-300/80 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950/60 p-4 text-xs sm:text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
              {activeArticle.summary}
            </p>

            <div className="text-sm leading-loose text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {activeArticle.content}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
