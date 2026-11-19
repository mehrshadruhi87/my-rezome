import React, { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { formatPersianDate } from "../../utils/formatters";
import type { NewsArticle } from "../../types";
import { toast } from "sonner";
import { Edit3, Newspaper, Plus, Save, Trash2, X } from "lucide-react";

export function AdminNewsTab() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("برنامه‌نویسی");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ news: NewsArticle[] }>("/api/admin/news");
      setArticles(res.news || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری اخبار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setContent("");
    setCategory("برنامه‌نویسی");
    setIsPublished(true);
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setTitle(article.title);
    setSummary(article.summary);
    setContent(article.content);
    setCategory(article.category);
    setIsPublished(article.isPublished);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category: category.trim() || "برنامه‌نویسی",
        isPublished,
      };
      if (editingId) {
        await apiRequest(`/api/admin/news/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("خبر با موفقیت ویرایش شد.");
      } else {
        await apiRequest("/api/admin/news", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("خبر جدید منتشر و در صفحه اصلی/اخبار ثبت شد.");
      }
      resetForm();
      await loadNews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره خبر");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/admin/news/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      toast.success("خبر حذف شد.");
      await loadNews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف خبر");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
            <span>{editingId ? "ویرایش خبر" : "انتشار خبر جدید برنامه‌نویسی"}</span>
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" /> انصراف
            </button>
          )}
        </div>

        <div>
          <label
            htmlFor="news-title"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            تیتر خبر *
          </label>
          <input
            id="news-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: انتشار نسخه جدید TypeScript و بهبود سرعت کامپایلر"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="news-category"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            دسته‌بندی خبر
          </label>
          <input
            id="news-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="هوش مصنوعی، فرانت‌اند، طراحی UI/UX..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="news-summary"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            خلاصه کوتاه خبر
          </label>
          <textarea
            id="news-summary"
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="چکیده یک یا دو خطی برای نمایش روی کارت خبر..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="news-content"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            متن کامل خبر
          </label>
          <textarea
            id="news-content"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="جزئیات کامل خبر و نکات فنی..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span>انتشار عمومی در صفحه اصلی و صفحه اخبار</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="btn-3d flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50"
        >
          {editingId ? (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "در حال ذخیره..." : "ذخیره ویرایش خبر"}</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>{saving ? "در حال انتشار..." : "انتشار خبر جدید"}</span>
            </>
          )}
        </button>
      </form>

      <div className="lg:col-span-7 space-y-3">
        {loading ? (
          <div className="h-44 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse" />
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/60 p-10 text-center text-xs text-slate-600 dark:text-slate-400">
            هنوز خبری ثبت نشده است.
          </div>
        ) : (
          articles.map((art) => (
            <div
              key={art.id}
              className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-md bg-[var(--accent-500)]/15 px-2 py-0.5 font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)]">
                    {art.category}
                  </span>
                  <span
                    className={`font-bold ${
                      art.isPublished
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {art.isPublished ? "منتشرشده" : "پیش‌نویس"}
                  </span>
                  <span className="text-slate-500">
                    {formatPersianDate(art.createdAt)}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {art.summary}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label={`ویرایش خبر ${art.title}`}
                  onClick={() => handleEdit(art)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:border-[var(--accent-500)] hover:text-[var(--accent-600)]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`حذف خبر ${art.title}`}
                  onClick={() => handleDelete(art.id)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:border-rose-500 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
