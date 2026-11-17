import React, { useEffect, useState } from "react";
import { Link } from "../router";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import {
  formatPersianDate,
  formatToman,
  getLevelInfo,
  toPersianDigits,
} from "../utils/formatters";
import type {
  ChapterItem,
  CourseLevel,
  CourseSummary,
  DiscountCodeItem,
  OrderRecord,
  PublicUser,
} from "../types";
import { toast } from "sonner";
import {
  BookOpen,
  Copy,
  Edit3,
  FolderTree,
  LayoutDashboard,
  Plus,
  ShieldAlert,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";

type AdminTab = "overview" | "courses" | "categories" | "coupons" | "users";

interface AdminUserRow extends PublicUser {
  enrolledCourseIds: string[];
  ordersCount: number;
}

interface CourseFormState {
  id?: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice: string;
  level: CourseLevel;
  duration: string;
  prerequisites: string;
  instructorName: string;
  instructorTitle: string;
  categoryId: string;
  isPublished: boolean;
  isFeatured: boolean;
  chapters: ChapterItem[];
}

export function AdminPage() {
  const { user, categories, refreshBootstrap } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalStudents: 0,
    publishedCourses: 0,
    totalCourses: 0,
    completedOrdersCount: 0,
    totalEnrollments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [coupons, setCoupons] = useState<DiscountCodeItem[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  // Course Editor Modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseFormState | null>(null);

  // Category Form
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Coupon Form
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [couponValue, setCouponValue] = useState(20);
  const [couponMaxUses, setCouponMaxUses] = useState(100);

  // Manual Enrollment
  const [grantCourseMap, setGrantCourseMap] = useState<Record<string, string>>(
    {}
  );

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, coursesRes, couponsRes, usersRes] = await Promise.all([
        apiRequest<{ stats: typeof stats; recentOrders: OrderRecord[] }>(
          "/api/admin/overview"
        ),
        apiRequest<{ courses: CourseSummary[] }>(
          "/api/courses?includeUnpublished=true"
        ),
        apiRequest<{ coupons: DiscountCodeItem[] }>("/api/admin/coupons"),
        apiRequest<{ users: AdminUserRow[] }>("/api/admin/users"),
      ]);
      setStats(overviewRes.stats);
      setRecentOrders(overviewRes.recentOrders);
      setCourses(coursesRes.courses);
      setCoupons(couponsRes.coupons);
      setUsers(usersRes.users);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری پنل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-500/30 bg-slate-900 p-8 space-y-4">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-400" />
          <h1 className="text-lg font-black text-white">
            دسترسی محدود به مدیر سیستم
          </h1>
          <p className="text-xs text-slate-400">
            برای دسترسی به کنسول مدیریت کدآکادمی باید با حساب دارای نقش مدیر وارد شوید.
          </p>
          <Link
            href="/auth/login?redirect=/admin"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white"
          >
            ورود با حساب مدیر
          </Link>
        </div>
      </div>
    );
  }

  const openNewCourseModal = () => {
    setCourseForm({
      title: "",
      slug: "",
      shortDesc: "",
      description: "",
      thumbnail: "/src/assets/images/course_nextjs_fullstack_1794952831549.jpg",
      price: 2500000,
      discountPrice: "",
      level: "ALL_LEVELS",
      duration: "۳۰ ساعت",
      prerequisites: "آشنایی مقدماتی با کامپیوتر",
      instructorName: user.name,
      instructorTitle: "مدرس ارشد کدآکادمی",
      categoryId: categories[0]?.id || "",
      isPublished: true,
      isFeatured: false,
      chapters: [
        {
          id: "temp_ch_1",
          title: "فصل اول: مبانی و معماری",
          position: 1,
          lessons: [
            {
              id: "temp_ls_1",
              title: "معرفی دوره و نقشه راه",
              duration: "۱۵:۰۰",
              videoUrl: "",
              isFree: true,
              position: 1,
            },
          ],
        },
      ],
    });
    setCourseModalOpen(true);
  };

  const openEditCourseModal = async (courseId: string) => {
    try {
      const res = await apiRequest<{ course: any }>(
        `/api/admin/courses/${courseId}`
      );
      const c = res.course;
      setCourseForm({
        id: c.id,
        title: c.title,
        slug: c.slug,
        shortDesc: c.shortDesc,
        description: c.description,
        thumbnail: c.thumbnail,
        price: c.price,
        discountPrice: c.discountPrice !== null ? String(c.discountPrice) : "",
        level: c.level,
        duration: c.duration,
        prerequisites: c.prerequisites,
        instructorName: c.instructorName,
        instructorTitle: c.instructorTitle,
        categoryId: c.categoryId,
        isPublished: c.isPublished,
        isFeatured: c.isFeatured,
        chapters: c.chapters || [],
      });
      setCourseModalOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری دوره");
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm) return;
    setSavingCourse(true);
    try {
      const payload = {
        ...courseForm,
        discountPrice:
          courseForm.discountPrice.trim() !== ""
            ? Number(courseForm.discountPrice)
            : null,
      };
      if (courseForm.id) {
        await apiRequest(`/api/admin/courses/${courseForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("دوره با موفقیت ویرایش شد.");
      } else {
        await apiRequest("/api/admin/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("دوره جدید با موفقیت ایجاد شد.");
      }
      setCourseModalOpen(false);
      await Promise.all([loadAdminData(), refreshBootstrap()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره دوره");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDuplicateCourse = async (id: string) => {
    try {
      await apiRequest(`/api/admin/courses/${id}/duplicate`, { method: "POST" });
      toast.success("نسخه پیش‌نویس کپی از دوره ساخته شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در کپی دوره");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await apiRequest(`/api/admin/courses/${id}`, { method: "DELETE" });
      toast.success("دوره حذف شد.");
      await Promise.all([loadAdminData(), refreshBootstrap()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف دوره");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await apiRequest("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          description: catDesc,
        }),
      });
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      toast.success("دسته‌بندی جدید اضافه شد.");
      await Promise.all([loadAdminData(), refreshBootstrap()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت دسته‌بندی");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await apiRequest(`/api/admin/categories/${id}`, { method: "DELETE" });
      toast.success("دسته‌بندی حذف شد.");
      await Promise.all([loadAdminData(), refreshBootstrap()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      await apiRequest("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: couponCode,
          type: couponType,
          value: couponValue,
          maxUses: couponMaxUses,
        }),
      });
      setCouponCode("");
      toast.success("کد تخفیف ایجاد شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ساخت کد تخفیف");
    }
  };

  const handleToggleCoupon = async (id: string, isActive: boolean) => {
    try {
      await apiRequest(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      toast.success("وضعیت کد تخفیف تغییر یافت.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await apiRequest(`/api/admin/coupons/${id}`, { method: "DELETE" });
      toast.success("کد تخفیف حذف شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا");
    }
  };

  const handleToggleRole = async (userId: string, nextRole: "ADMIN" | "STUDENT") => {
    try {
      await apiRequest(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      toast.success("نقش کاربر به‌روزرسانی شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا");
    }
  };

  const handleGrantEnrollment = async (userId: string) => {
    const courseId = grantCourseMap[userId] || courses[0]?.id;
    if (!courseId) return;
    try {
      await apiRequest("/api/admin/enrollments", {
        method: "POST",
        body: JSON.stringify({ userId, courseId }),
      });
      toast.success("دسترسی دوره برای دانشجو فعال شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در فعال‌سازی دسترسی");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-400">
            کنسول مدیریت (RBAC)
          </span>
          <h1 className="mt-1 text-2xl font-black text-white">
            مدیریت پلتفرم کدآکادمی
          </h1>
        </div>
        <button
          type="button"
          onClick={openNewCourseModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن دوره جدید</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "overview" as const, label: "نمای کلی و سفارش‌ها", icon: LayoutDashboard },
          { id: "courses" as const, label: "دوره‌ها و سرفصل‌ها", icon: BookOpen },
          { id: "categories" as const, label: "دسته‌بندی‌ها", icon: FolderTree },
          { id: "coupons" as const, label: "کدهای تخفیف", icon: Tag },
          { id: "users" as const, label: "کاربران و دسترسی‌ها", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                active
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
      ) : (
        <>
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 tabular-nums">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-400">درآمد کل تاییدشده</div>
                  <div className="mt-2 text-xl font-black text-emerald-400">
                    {formatToman(stats.totalRevenue)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-400">تعداد سفارش‌های موفق</div>
                  <div className="mt-2 text-xl font-black text-white">
                    {toPersianDigits(stats.completedOrdersCount)} سفارش
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-400">دوره‌های منتشرشده</div>
                  <div className="mt-2 text-xl font-black text-indigo-400">
                    {toPersianDigits(stats.publishedCourses)} از{" "}
                    {toPersianDigits(stats.totalCourses)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-400">کل ثبت‌نام‌های فعال</div>
                  <div className="mt-2 text-xl font-black text-white">
                    {toPersianDigits(stats.totalEnrollments)} دسترسی
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <div className="border-b border-slate-800 px-5 py-3.5 text-sm font-bold text-white">
                  آخرین سفارش‌ها و تراکنش‌ها
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">شماره سفارش</th>
                      <th className="px-4 py-3">کاربر</th>
                      <th className="px-4 py-3">تاریخ</th>
                      <th className="px-4 py-3">مبلغ نهایی</th>
                      <th className="px-4 py-3">کد پیگیری</th>
                      <th className="px-4 py-3">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 tabular-nums">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {ord.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {ord.userName}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {formatPersianDate(ord.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          {formatToman(ord.finalAmount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {ord.paymentRef || "—"}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <span
                            className={
                              ord.status === "COMPLETED"
                                ? "text-emerald-400"
                                : ord.status === "FAILED"
                                ? "text-rose-400"
                                : "text-amber-400"
                            }
                          >
                            {ord.status === "COMPLETED"
                              ? "موفق"
                              : ord.status === "FAILED"
                              ? "ناموفق"
                              : "در انتظار"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. COURSES */}
          {activeTab === "courses" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">عنوان دوره</th>
                    <th className="px-4 py-3.5">دسته‌بندی</th>
                    <th className="px-4 py-3.5">سطح</th>
                    <th className="px-4 py-3.5">قیمت</th>
                    <th className="px-4 py-3.5">دانشجو</th>
                    <th className="px-4 py-3.5">وضعیت</th>
                    <th className="px-4 py-3.5">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 font-bold text-white max-w-xs truncate">
                        {c.title}
                      </td>
                      <td className="px-4 py-3.5 text-indigo-400">
                        {c.category.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {getLevelInfo(c.level).label}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        {formatToman(c.discountPrice ?? c.price)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {toPersianDigits(c.studentsCount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={
                            c.isPublished
                              ? "text-emerald-400 font-bold"
                              : "text-amber-400 font-bold"
                          }
                        >
                          {c.isPublished ? "منتشرشده" : "پیش‌نویس"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`ویرایش ${c.title}`}
                            onClick={() => openEditCourseModal(c.id)}
                            className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-indigo-500 hover:text-indigo-400"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`کپی ${c.title}`}
                            onClick={() => handleDuplicateCourse(c.id)}
                            className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`حذف ${c.title}`}
                            onClick={() => handleDeleteCourse(c.id)}
                            className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-rose-500 hover:text-rose-400"
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
          )}

          {/* 3. CATEGORIES */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
              <form
                onSubmit={handleCreateCategory}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4"
              >
                <h2 className="text-sm font-bold text-white">
                  افزودن دسته‌بندی جدید
                </h2>
                <div>
                  <label
                    htmlFor="cat-name"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    نام دسته‌بندی
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="مثلاً: بلاک‌چین و وب۳"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cat-slug"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    اسلاگ انگلیسی (اختیاری)
                  </label>
                  <input
                    id="cat-slug"
                    type="text"
                    dir="ltr"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="web3"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cat-desc"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    توضیح کوتاه
                  </label>
                  <input
                    id="cat-desc"
                    type="text"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  ثبت دسته‌بندی
                </button>
              </form>

              <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">نام</th>
                      <th className="px-4 py-3">اسلاگ</th>
                      <th className="px-4 py-3">توضیحات</th>
                      <th className="px-4 py-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="px-4 py-3 font-bold text-white">
                          {cat.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-400">
                          {cat.slug}
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                          {cat.description}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-label={`حذف دسته‌بندی ${cat.name}`}
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. COUPONS */}
          {activeTab === "coupons" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
              <form
                onSubmit={handleCreateCoupon}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4"
              >
                <h2 className="text-sm font-bold text-white">ساخت کد تخفیف</h2>
                <div>
                  <label
                    htmlFor="cpn-code"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    کد تخفیف (حروف انگلیسی)
                  </label>
                  <input
                    id="cpn-code"
                    type="text"
                    required
                    dir="ltr"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="SUMMER25"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="cpn-type"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      نوع تخفیف
                    </label>
                    <select
                      id="cpn-type"
                      value={couponType}
                      onChange={(e) =>
                        setCouponType(e.target.value as "PERCENTAGE" | "FIXED")
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="PERCENTAGE">درصدی (٪)</option>
                      <option value="FIXED">مبلغ ثابت (تومان)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="cpn-val"
                      className="block text-xs text-slate-300 mb-1"
                    >
                      مقدار
                    </label>
                    <input
                      id="cpn-val"
                      type="number"
                      min={1}
                      value={couponValue}
                      onChange={(e) => setCouponValue(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="cpn-max"
                    className="block text-xs text-slate-300 mb-1"
                  >
                    سقف تعداد استفاده
                  </label>
                  <input
                    id="cpn-max"
                    type="number"
                    min={1}
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  ایجاد کد تخفیف
                </button>
              </form>

              <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">کد</th>
                      <th className="px-4 py-3">مقدار</th>
                      <th className="px-4 py-3">مصرف</th>
                      <th className="px-4 py-3">وضعیت</th>
                      <th className="px-4 py-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 tabular-nums">
                    {coupons.map((cpn) => (
                      <tr key={cpn.id}>
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {cpn.code}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">
                          {cpn.type === "PERCENTAGE"
                            ? `${toPersianDigits(cpn.value)}٪`
                            : formatToman(cpn.value)}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {toPersianDigits(cpn.usedCount)} /{" "}
                          {toPersianDigits(cpn.maxUses)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCoupon(cpn.id, !cpn.isActive)
                            }
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                              cpn.isActive
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {cpn.isActive ? "فعال" : "غیرفعال"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-label={`حذف کد ${cpn.code}`}
                            onClick={() => handleDeleteCoupon(cpn.id)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. USERS & MANUAL ENROLLMENT */}
          {activeTab === "users" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">نام کاربر</th>
                    <th className="px-4 py-3.5">ایمیل</th>
                    <th className="px-4 py-3.5">نقش</th>
                    <th className="px-4 py-3.5">دوره‌های فعال</th>
                    <th className="px-4 py-3.5">اعطای دستی دسترسی دوره</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3.5 font-bold text-white">
                        {u.name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {u.email}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          aria-label={`نقش کاربر ${u.name}`}
                          value={u.role}
                          onChange={(e) =>
                            handleToggleRole(
                              u.id,
                              e.target.value as "ADMIN" | "STUDENT"
                            )
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white"
                        >
                          <option value="STUDENT">دانشجو</option>
                          <option value="ADMIN">مدیر سیستم</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-emerald-400 font-bold">
                        {toPersianDigits(u.enrolledCourseIds.length)} دوره
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`انتخاب دوره برای ${u.name}`}
                            value={grantCourseMap[u.id] || courses[0]?.id || ""}
                            onChange={(e) =>
                              setGrantCourseMap((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            className="max-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
                          >
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleGrantEnrollment(u.id)}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-500 shrink-0"
                          >
                            فعال‌سازی
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* COURSE & CURRICULUM BUILDER MODAL */}
      {courseModalOpen && courseForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="ویرایشگر دوره و سرفصل‌ها"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-base font-black text-white">
                {courseForm.id ? "ویرایش دوره و سرفصل‌ها" : "ایجاد دوره جدید"}
              </h2>
              <button
                type="button"
                aria-label="بستن ویرایشگر دوره"
                onClick={() => setCourseModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCourse}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="course-title"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    عنوان دوره
                  </label>
                  <input
                    id="course-title"
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-category"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    دسته‌بندی
                  </label>
                  <select
                    id="course-category"
                    value={courseForm.categoryId}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        categoryId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="course-level"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    سطح دوره
                  </label>
                  <select
                    id="course-level"
                    value={courseForm.level}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        level: e.target.value as CourseLevel,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="ALL_LEVELS">مقدماتی تا پیشرفته</option>
                    <option value="BEGINNER">مقدماتی</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">پیشرفته</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="course-price"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    قیمت اصلی (تومان)
                  </label>
                  <input
                    id="course-price"
                    type="number"
                    min={0}
                    value={courseForm.price}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-discount"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    قیمت با تخفیف (اختیاری)
                  </label>
                  <input
                    id="course-discount"
                    type="number"
                    min={0}
                    value={courseForm.discountPrice}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        discountPrice: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-instructor"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    نام مدرس
                  </label>
                  <input
                    id="course-instructor"
                    type="text"
                    value={courseForm.instructorName}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        instructorName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-duration"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    مدت زمان آموزش
                  </label>
                  <input
                    id="course-duration"
                    type="text"
                    value={courseForm.duration}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, duration: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="course-shortdesc"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    معرفی کوتاه
                  </label>
                  <input
                    id="course-shortdesc"
                    type="text"
                    required
                    value={courseForm.shortDesc}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        shortDesc: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="course-desc"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    توضیحات کامل دوره
                  </label>
                  <textarea
                    id="course-desc"
                    rows={3}
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-6 sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={courseForm.isPublished}
                      onChange={(e) =>
                        setCourseForm({
                          ...courseForm,
                          isPublished: e.target.checked,
                        })
                      }
                    />
                    <span>انتشار عمومی در کاتالوگ</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={courseForm.isFeatured}
                      onChange={(e) =>
                        setCourseForm({
                          ...courseForm,
                          isFeatured: e.target.checked,
                        })
                      }
                    />
                    <span>نمایش در دوره‌های ویژه</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Curriculum Builder */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-400">
                    ساختار فصل‌ها و جلسات
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setCourseForm({
                        ...courseForm,
                        chapters: [
                          ...courseForm.chapters,
                          {
                            id: `ch_${Date.now()}`,
                            title: `فصل ${toPersianDigits(
                              courseForm.chapters.length + 1
                            )}`,
                            position: courseForm.chapters.length + 1,
                            lessons: [],
                          },
                        ],
                      })
                    }
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-600"
                  >
                    + افزودن فصل
                  </button>
                </div>

                {courseForm.chapters.map((ch, cIdx) => (
                  <div
                    key={ch.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) => {
                          const next = [...courseForm.chapters];
                          next[cIdx] = { ...ch, title: e.target.value };
                          setCourseForm({ ...courseForm, chapters: next });
                        }}
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...courseForm.chapters];
                          next[cIdx] = {
                            ...ch,
                            lessons: [
                              ...ch.lessons,
                              {
                                id: `ls_${Date.now()}`,
                                title: "جلسه جدید",
                                duration: "۲۰:۰۰",
                                videoUrl: "",
                                isFree: false,
                                position: ch.lessons.length + 1,
                              },
                            ],
                          };
                          setCourseForm({ ...courseForm, chapters: next });
                        }}
                        className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] text-indigo-300 hover:bg-indigo-600 hover:text-white"
                      >
                        + جلسه
                      </button>
                      <button
                        type="button"
                        aria-label={`حذف فصل ${ch.title}`}
                        onClick={() =>
                          setCourseForm({
                            ...courseForm,
                            chapters: courseForm.chapters.filter(
                              (_, i) => i !== cIdx
                            ),
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {ch.lessons.map((les, lIdx) => (
                      <div
                        key={les.id}
                        className="flex flex-wrap items-center gap-2 pr-4"
                      >
                        <input
                          type="text"
                          value={les.title}
                          onChange={(e) => {
                            const next = [...courseForm.chapters];
                            const lessons = [...ch.lessons];
                            lessons[lIdx] = { ...les, title: e.target.value };
                            next[cIdx] = { ...ch, lessons };
                            setCourseForm({ ...courseForm, chapters: next });
                          }}
                          placeholder="عنوان جلسه"
                          className="flex-1 min-w-[160px] rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
                        />
                        <input
                          type="text"
                          value={les.duration}
                          onChange={(e) => {
                            const next = [...courseForm.chapters];
                            const lessons = [...ch.lessons];
                            lessons[lIdx] = { ...les, duration: e.target.value };
                            next[cIdx] = { ...ch, lessons };
                            setCourseForm({ ...courseForm, chapters: next });
                          }}
                          className="w-20 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 text-center"
                        />
                        <label className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <input
                            type="checkbox"
                            checked={les.isFree}
                            onChange={(e) => {
                              const next = [...courseForm.chapters];
                              const lessons = [...ch.lessons];
                              lessons[lIdx] = {
                                ...les,
                                isFree: e.target.checked,
                              };
                              next[cIdx] = { ...ch, lessons };
                              setCourseForm({ ...courseForm, chapters: next });
                            }}
                          />
                          <span>رایگان</span>
                        </label>
                        <button
                          type="button"
                          aria-label={`حذف جلسه ${les.title}`}
                          onClick={() => {
                            const next = [...courseForm.chapters];
                            next[cIdx] = {
                              ...ch,
                              lessons: ch.lessons.filter((_, i) => i !== lIdx),
                            };
                            setCourseForm({ ...courseForm, chapters: next });
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingCourse ? "در حال ذخیره..." : "ذخیره دوره"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
