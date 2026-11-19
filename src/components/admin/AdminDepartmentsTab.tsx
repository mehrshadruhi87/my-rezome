import React, { useState } from "react";
import { apiRequest } from "../../lib/api";
import type { CategoryItem } from "../../types";
import { toPersianDigits } from "../../utils/formatters";
import { toast } from "sonner";
import { Edit3, FolderTree, Plus, Save, Trash2, X } from "lucide-react";

const ICON_OPTIONS = [
  { value: "Layout", label: "فرانت‌اند (Layout)" },
  { value: "Server", label: "بک‌اند (Server)" },
  { value: "BrainCircuit", label: "هوش مصنوعی (BrainCircuit)" },
  { value: "ShieldCheck", label: "امنیت (ShieldCheck)" },
  { value: "Smartphone", label: "موبایل (Smartphone)" },
  { value: "CloudCog", label: "دواپس (CloudCog)" },
  { value: "Palette", label: "طراحی UI/UX و فیگما (Palette)" },
  { value: "Globe", label: "وردپرس و وب (Globe)" },
  { value: "Terminal", label: "عمومی / ترمینال (Terminal)" },
];

interface AdminDepartmentsTabProps {
  categories: CategoryItem[];
  onRefresh: () => Promise<void>;
}

export function AdminDepartmentsTab({
  categories,
  onRefresh,
}: AdminDepartmentsTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Palette");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setIcon("Palette");
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setIcon(cat.icon || "Terminal");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await apiRequest(`/api/admin/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            icon,
          }),
        });
        toast.success("دپارتمان تخصصی با موفقیت ویرایش شد.");
      } else {
        await apiRequest("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            icon,
          }),
        });
        toast.success("دپارتمان تخصصی جدید اضافه شد.");
      }
      resetForm();
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره دپارتمان");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    try {
      await apiRequest(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      if (editingId === cat.id) resetForm();
      toast.success(`دپارتمان «${cat.name}» حذف شد.`);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف دپارتمان");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
            <span>
              {editingId ? "ویرایش دپارتمان تخصصی" : "افزودن دپارتمان جدید"}
            </span>
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
              انصراف
            </button>
          )}
        </div>

        <div>
          <label
            htmlFor="dept-name"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            عنوان دپارتمان *
          </label>
          <input
            id="dept-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: طراحی رابط کاربری و فیگما (UI/UX & Figma)"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="dept-slug"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            اسلاگ انگلیسی (اختیاری)
          </label>
          <input
            id="dept-slug"
            type="text"
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ui-ux-figma"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
          />
        </div>

        <div>
          <label
            htmlFor="dept-icon"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            آیکون کارت دپارتمان
          </label>
          <select
            id="dept-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dept-desc"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            توضیح کوتاه
          </label>
          <textarea
            id="dept-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح مختصر درباره مهارت‌ها و ابزارهای این دپارتمان"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-3d flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50"
        >
          {editingId ? (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>ذخیره ویرایش دپارتمان</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>ثبت دپارتمان جدید</span>
            </>
          )}
        </button>
      </form>

      <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75">
        <table className="w-full text-right text-xs">
          <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">نام دپارتمان</th>
              <th className="px-4 py-3">اسلاگ</th>
              <th className="px-4 py-3">تعداد دوره</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/80 dark:divide-slate-800/70">
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-[#DFE7F2]/60 dark:hover:bg-slate-800/30"
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {cat.description}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                  {cat.slug}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {toPersianDigits(cat.coursesCount ?? 0)} دوره
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`ویرایش دپارتمان ${cat.name}`}
                      onClick={() => startEdit(cat)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 hover:border-[var(--accent-500)] hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`حذف دپارتمان ${cat.name}`}
                      onClick={() => handleDelete(cat)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-400 hover:border-rose-500 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
