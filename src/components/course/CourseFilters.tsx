import React, { useState } from "react";
import { useRouter, useSearchParams } from "../../router";
import type { CategoryItem } from "../../types";
import { Filter, RotateCcw } from "lucide-react";

interface Props {
  categories: CategoryItem[];
}

export function CourseFilters({ categories }: Props) {
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentLevel = searchParams.get("level") || "";
  const currentPrice = searchParams.get("price") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentQuery = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(currentQuery);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    push(qs ? `/courses?${qs}` : "/courses");
  };

  const resetAll = () => {
    setLocalQuery("");
    push("/courses");
  };

  return (
    <aside className="space-y-6 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <Filter className="h-4 w-4 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
          <span>فیلترهای پیشرفته</span>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>حذف فیلترها</span>
        </button>
      </div>

      <div>
        <label
          htmlFor="catalog-search-input"
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2"
        >
          جستجو در عنوان دوره
        </label>
        <div className="flex gap-2">
          <input
            id="catalog-search-input"
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("q", localQuery.trim());
              }
            }}
            placeholder="نام دوره یا مدرس..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-[var(--accent-500)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => updateFilter("q", localQuery.trim())}
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-600)] transition-colors shrink-0"
          >
            اعمال
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="catalog-sort-select"
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2"
        >
          مرتب‌سازی بر اساس
        </label>
        <select
          id="catalog-sort-select"
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:border-[var(--accent-500)] focus:outline-none"
        >
          <option value="newest">جدیدترین دوره‌ها</option>
          <option value="popular">پرفروش‌ترین و محبوب‌ترین</option>
          <option value="cheapest">ارزان‌ترین قیمت</option>
        </select>
      </div>

      <div>
        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          دپارتمان تخصصی
        </span>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateFilter("category", "")}
            className={`w-full text-right rounded-xl px-3 py-2 text-xs transition-colors ${
              currentCategory === ""
                ? "bg-[var(--accent-600)] text-white font-bold"
                : "text-slate-700 dark:text-slate-400 hover:bg-[#DFE7F2] dark:hover:bg-slate-800"
            }`}
          >
            همه دسته‌بندی‌ها
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => updateFilter("category", cat.slug)}
              className={`w-full text-right rounded-xl px-3 py-2 text-xs transition-colors ${
                currentCategory === cat.slug
                  ? "bg-[var(--accent-600)] text-white font-bold"
                  : "text-slate-700 dark:text-slate-400 hover:bg-[#DFE7F2] dark:hover:bg-slate-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          سطح مهارت دوره
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "", label: "همه سطوح" },
            { value: "BEGINNER", label: "مقدماتی" },
            { value: "INTERMEDIATE", label: "متوسط" },
            { value: "ADVANCED", label: "پیشرفته" },
            { value: "ALL_LEVELS", label: "صفر تا صد" },
          ].map((lvl) => (
            <button
              type="button"
              key={lvl.value}
              onClick={() => updateFilter("level", lvl.value)}
              className={`rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                currentLevel === lvl.value
                  ? "border-[var(--accent-500)] bg-[var(--accent-500)]/15 text-[var(--accent-700)] dark:text-[var(--accent-300)] font-bold"
                  : "border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          نوع سرمایه‌گذاری
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "", label: "همه" },
            { value: "free", label: "رایگان" },
            { value: "paid", label: "نقدی" },
          ].map((pr) => (
            <button
              type="button"
              key={pr.value}
              onClick={() => updateFilter("price", pr.value)}
              className={`rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                currentPrice === pr.value
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
