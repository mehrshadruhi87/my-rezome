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
import {
  COURSE_THUMBNAIL_PRESETS,
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../data/courseAssets";
import type {
  ChapterItem,
  CourseLevel,
  CourseSummary,
  DiscountCodeItem,
  OrderRecord,
  OrderStatus,
  PublicUser,
  ReviewItem,
} from "../types";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Film,
  FolderTree,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Percent,
  Plus,
  Receipt,
  Settings,
  ShieldAlert,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { AdminSettingsTab } from "../components/admin/AdminSettingsTab";
import { AdminMediaUploadManager } from "../components/admin/AdminMediaUploadManager";
import { AdminDepartmentsTab } from "../components/admin/AdminDepartmentsTab";
import { AdminInstructorsTab } from "../components/admin/AdminInstructorsTab";
import { AdminNewsTab } from "../components/admin/AdminNewsTab";

type AdminTab =
  | "overview"
  | "courses"
  | "media"
  | "categories"
  | "instructors"
  | "news"
  | "orders"
  | "reviews"
  | "coupons"
  | "users"
  | "settings";

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
  fullAccess: boolean;
  instructorSharePercent: number;
  instructorDiscountPercent: number;
  chapters: ChapterItem[];
}

export function AdminPage() {
  const { user, categories, refreshBootstrap } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isApprovedInstructor =
    user?.role === "INSTRUCTOR" &&
    user?.instructorStatus !== "pending" &&
    user?.instructorStatus !== "rejected";
  const isPendingInstructor = user?.instructorStatus === "pending";

  const [activeTab, setActiveTab] = useState<AdminTab>(
    isAdmin ? "overview" : "courses"
  );
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    publishedCourses: 0,
    totalCourses: 0,
    totalOrdersCount: 0,
    completedOrdersCount: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalEnrollments: 0,
    pendingReviewsCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<PublicUser[]>(
    []
  );
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [coupons, setCoupons] = useState<DiscountCodeItem[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  // Course Editor Modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseFormState | null>(null);

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
      if (isAdmin) {
        const [
          overviewRes,
          coursesRes,
          ordersRes,
          reviewsRes,
          couponsRes,
          usersRes,
        ] = await Promise.all([
          apiRequest<{
            stats: typeof stats;
            recentOrders: OrderRecord[];
            recentRegistrations?: PublicUser[];
          }>("/api/admin/overview"),
          apiRequest<{ courses: CourseSummary[] }>(
            "/api/courses?includeUnpublished=true&limit=100"
          ),
          apiRequest<{ orders: OrderRecord[] }>("/api/admin/orders?limit=50"),
          apiRequest<{ reviews: ReviewItem[] }>("/api/admin/reviews?limit=50"),
          apiRequest<{ coupons: DiscountCodeItem[] }>("/api/admin/coupons"),
          apiRequest<{ users: AdminUserRow[] }>("/api/admin/users?limit=100"),
        ]);
        setStats(overviewRes.stats);
        setRecentOrders(overviewRes.recentOrders);
        setRecentRegistrations(overviewRes.recentRegistrations || []);
        setCourses(coursesRes.courses);
        setAllOrders(ordersRes.orders);
        setReviews(reviewsRes.reviews);
        setCoupons(couponsRes.coupons);
        setUsers(usersRes.users);
      } else if (isApprovedInstructor) {
        const coursesRes = await apiRequest<{ courses: CourseSummary[] }>(
          "/api/courses?includeUnpublished=true&limit=100"
        );
        setCourses(coursesRes.courses);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری پنل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else if (isApprovedInstructor) {
      setActiveTab("courses");
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.instructorStatus]);

  if (!user || (!isAdmin && !isApprovedInstructor)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-300 dark:border-rose-500/30 bg-[#E9EFF6] dark:bg-slate-900 p-8 space-y-4 shadow-xl">
          {isPendingInstructor ? (
            <>
              <Clock className="mx-auto h-10 w-10 text-amber-500" />
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                حساب مدرسی شما در انتظار تایید مدیریت است
              </h1>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                درخواست ثبت‌نام مدرس شما ثبت شده است. بلافاصله پس از تایید مدیر سیستم، دسترسی ایجاد دوره و آپلود ویدیو و فایل در همین صفحه برای شما باز می‌شود.
              </p>
              <Link
                href="/dashboard"
                className="btn-3d inline-block rounded-xl px-6 py-3 text-xs font-bold"
              >
                بازگشت به پنل کاربری
              </Link>
            </>
          ) : (
            <>
              <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                دسترسی محدود به مدیر سیستم و مدرسین تاییدشده
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                برای دسترسی به کنسول مدیریت یا پنل انتشار دوره باید با حساب مدیر یا مدرس تاییدشده وارد شوید.
              </p>
              <Link
                href="/auth/login?redirect=/admin"
                className="btn-3d inline-block rounded-xl px-6 py-3 text-xs font-bold"
              >
                ورود با حساب مدیر / مدرس
              </Link>
            </>
          )}
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
      thumbnail: COURSE_THUMBNAIL_PRESETS[0].legacyPath,
      price: 2500000,
      discountPrice: "",
      level: "ALL_LEVELS",
      duration: "۳۰ ساعت",
      prerequisites: "آشنایی مقدماتی با کامپیوتر",
      instructorName: user.name,
      instructorTitle: isAdmin ? "مدرس ارشد کدآکادمی" : "مدرس تاییدشده کدآکادمی",
      categoryId: categories[0]?.id || "",
      isPublished: true,
      isFeatured: false,
      fullAccess: false,
      instructorSharePercent: 70,
      instructorDiscountPercent: 0,
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
              attachments: [],
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
        categoryId: c.categoryId || c.category?.id || categories[0]?.id || "",
        isPublished: c.isPublished,
        isFeatured: c.isFeatured,
        fullAccess: Boolean(c.fullAccess),
        instructorSharePercent:
          typeof c.instructorSharePercent === "number"
            ? c.instructorSharePercent
            : 70,
        instructorDiscountPercent:
          typeof c.instructorDiscountPercent === "number"
            ? c.instructorDiscountPercent
            : 0,
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

  const handleToggleFullAccess = async (course: CourseSummary) => {
    try {
      const detailRes = await apiRequest<{ course: any }>(
        `/api/admin/courses/${course.id}`
      );
      const nextVal = !course.fullAccess;
      await apiRequest(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...detailRes.course,
          categoryId: detailRes.course.categoryId || course.category.id,
          fullAccess: nextVal,
        }),
      });
      toast.success(
        nextVal
          ? `دسترسی کامل برای «${course.title}» فعال شد.`
          : `دسترسی کامل برای «${course.title}» غیرفعال شد.`
      );
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر دسترسی");
    }
  };

  const handleDuplicateCourse = async (id: string) => {
    try {
      await apiRequest(`/api/admin/courses/${id}/duplicate`, {
        method: "POST",
      });
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

  const handleToggleRole = async (
    userId: string,
    nextRole: "ADMIN" | "INSTRUCTOR" | "STUDENT"
  ) => {
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

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiRequest(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      toast.success(isActive ? "حساب کاربر فعال شد." : "حساب کاربر مسدود شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "خطا در تغییر وضعیت کاربر"
      );
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ) => {
    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success("وضعیت سفارش به‌روزرسانی شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "خطا در تغییر وضعیت سفارش"
      );
    }
  };

  const handleModerateReview = async (
    reviewId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      await apiRequest(`/api/admin/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(
        status === "APPROVED" ? "دیدگاه تایید و منتشر شد." : "دیدگاه رد شد."
      );
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بررسی دیدگاه");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await apiRequest(`/api/reviews/${reviewId}`, { method: "DELETE" });
      toast.success("دیدگاه حذف شد.");
      await loadAdminData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف دیدگاه");
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!courseForm) return;
    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "courses");
      const res = await apiRequest<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData,
      });
      setCourseForm({ ...courseForm, thumbnail: res.url });
      toast.success("تصویر کاور با موفقیت آپلود شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در آپلود تصویر");
    } finally {
      setUploadingThumbnail(false);
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
      toast.error(
        err instanceof Error ? err.message : "خطا در فعال‌سازی دسترسی"
      );
    }
  };

  const navTabs: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }> = [
    { id: "overview", label: "نمای کلی", icon: LayoutDashboard, adminOnly: true },
    { id: "courses", label: "دوره‌ها و قیمت‌گذاری", icon: BookOpen },
    { id: "media", label: "ویدیو و فایل‌ها", icon: Film },
    { id: "categories", label: "دپارتمان‌ها", icon: FolderTree, adminOnly: true },
    {
      id: "instructors",
      label: "تایید مدرسین",
      icon: GraduationCap,
      adminOnly: true,
    },
    { id: "news", label: "اخبار برنامه‌نویسی", icon: Newspaper, adminOnly: true },
    { id: "orders", label: "سفارش‌ها", icon: Receipt, adminOnly: true },
    { id: "reviews", label: "دیدگاه‌ها", icon: MessageSquare, adminOnly: true },
    { id: "coupons", label: "کدهای تخفیف", icon: Tag, adminOnly: true },
    { id: "users", label: "کاربران", icon: Users, adminOnly: true },
    { id: "settings", label: "تنظیمات پلتفرم", icon: Settings, adminOnly: true },
  ];

  const visibleTabs = isAdmin
    ? navTabs
    : navTabs.filter((t) => !t.adminOnly);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {isAdmin ? "کنسول مدیریت جامع (Super Admin)" : "پنل اختصاصی مدرس تاییدشده"}
          </span>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {isAdmin ? "مدیریت پلتفرم کدآکادمی" : `پنل تدریس · ${user.name}`}
          </h1>
        </div>
        <button
          type="button"
          onClick={openNewCourseModal}
          className="btn-3d inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن دوره جدید</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors whitespace-nowrap ${
                active
                  ? "bg-[var(--accent-600)] text-white shadow-sm"
                  : "border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-[#DFE7F2] dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900/50 animate-pulse" />
      ) : (
        <>
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && isAdmin && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 tabular-nums">
                <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    درآمد کل تاییدشده
                  </div>
                  <div className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatToman(stats.totalRevenue)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    این ماه: {formatToman(stats.monthlyRevenue)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    تعداد سفارش‌ها
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                    {toPersianDigits(stats.completedOrdersCount)} موفق
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    از کل {toPersianDigits(stats.totalOrdersCount)} سفارش
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    کاربران پلتفرم
                  </div>
                  <div className="mt-2 text-xl font-black text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                    {toPersianDigits(stats.totalUsers)} کاربر
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {toPersianDigits(stats.totalStudents)} دانشجو ·{" "}
                    {toPersianDigits(stats.totalInstructors)} مدرس
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-5">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    دوره‌ها و ثبت‌نام‌ها
                  </div>
                  <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                    {toPersianDigits(stats.publishedCourses)} از{" "}
                    {toPersianDigits(stats.totalCourses)} دوره
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {toPersianDigits(stats.totalEnrollments)} دسترسی فعال
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
                <div className="border-b border-slate-300 dark:border-slate-800 px-5 py-3.5 text-sm font-black text-slate-900 dark:text-white">
                  آخرین سفارش‌ها و تراکنش‌ها
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">شماره سفارش</th>
                      <th className="px-4 py-3">کاربر</th>
                      <th className="px-4 py-3">تاریخ</th>
                      <th className="px-4 py-3">مبلغ نهایی</th>
                      <th className="px-4 py-3">کد پیگیری</th>
                      <th className="px-4 py-3">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70 tabular-nums">
                    {recentOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className="hover:bg-[#DFE7F2]/60 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {ord.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {ord.userName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {formatPersianDate(ord.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400">
                          {formatToman(ord.finalAmount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {ord.paymentRef || "—"}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          <span
                            className={
                              ord.status === "COMPLETED"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : ord.status === "FAILED"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-amber-700 dark:text-amber-400"
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

              {recentRegistrations.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
                  <div className="border-b border-slate-300 dark:border-slate-800 px-5 py-3.5 text-sm font-black text-slate-900 dark:text-white">
                    آخرین ثبت‌نام‌ها
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">نام</th>
                        <th className="px-4 py-3">ایمیل / شناسه</th>
                        <th className="px-4 py-3">نقش</th>
                        <th className="px-4 py-3">تاریخ عضویت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70">
                      {recentRegistrations.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-[#DFE7F2]/60 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            {u.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {u.email || u.phone || u.username}
                          </td>
                          <td className="px-4 py-3 text-[var(--accent-700)] dark:text-[var(--accent-400)] font-semibold">
                            {u.role === "ADMIN"
                              ? "مدیر"
                              : u.role === "INSTRUCTOR"
                              ? "مدرس"
                              : "دانشجو"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {formatPersianDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. COURSES & PRICING / FULL ACCESS / INSTRUCTOR SHARE */}
          {activeTab === "courses" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">عنوان دوره</th>
                    <th className="px-4 py-3.5">دپارتمان</th>
                    <th className="px-4 py-3.5">قیمت / تخفیف</th>
                    <th className="px-4 py-3.5">سهم مدرس</th>
                    <th className="px-4 py-3.5">دسترسی کامل</th>
                    <th className="px-4 py-3.5">وضعیت</th>
                    <th className="px-4 py-3.5">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70 tabular-nums">
                  {courses.map((c) => {
                    const share = c.instructorSharePercent ?? 70;
                    const shareDisc = c.instructorDiscountPercent ?? 0;
                    const effectiveShare = Math.max(0, share - shareDisc);
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-[#DFE7F2]/60 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {c.title}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            {c.instructorName} · {getLevelInfo(c.level).label}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--accent-700)] dark:text-[var(--accent-400)] font-semibold">
                          {c.category.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">
                            {formatToman(c.discountPrice ?? c.price)}
                          </div>
                          {c.discountPrice !== null &&
                            c.discountPrice < c.price && (
                              <div className="text-[10px] text-slate-500 line-through">
                                {formatToman(c.price)}
                              </div>
                            )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {toPersianDigits(effectiveShare)}٪ خالص
                          </div>
                          {shareDisc > 0 && (
                            <div className="text-[10px] text-amber-700 dark:text-amber-400">
                              کسر تخفیف سهم: {toPersianDigits(shareDisc)}٪
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleFullAccess(c)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                              c.fullAccess
                                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40"
                                : "bg-[#DFE7F2] dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <KeyRound className="h-3 w-3" />
                            <span>{c.fullAccess ? "باز (کامل)" : "عادی"}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={
                              c.isPublished
                                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                                : "text-amber-700 dark:text-amber-400 font-bold"
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
                              className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-700 dark:text-slate-300 hover:border-[var(--accent-500)] hover:text-[var(--accent-600)]"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`کپی ${c.title}`}
                              onClick={() => handleDuplicateCourse(c.id)}
                              className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`حذف ${c.title}`}
                              onClick={() => handleDeleteCourse(c.id)}
                              className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-700 dark:text-slate-300 hover:border-rose-500 hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 2.2 VIDEO & FILE UPLOAD MANAGER */}
          {activeTab === "media" && (
            <AdminMediaUploadManager
              courses={courses}
              onSaved={async () => {
                await loadAdminData();
              }}
            />
          )}

          {/* 3. SPECIALIZED DEPARTMENTS CRUD */}
          {activeTab === "categories" && isAdmin && (
            <AdminDepartmentsTab
              categories={categories}
              onRefresh={async () => {
                await Promise.all([loadAdminData(), refreshBootstrap()]);
              }}
            />
          )}

          {/* 3.5 INSTRUCTOR APPROVALS */}
          {activeTab === "instructors" && isAdmin && (
            <AdminInstructorsTab onStatusChanged={loadAdminData} />
          )}

          {/* 3.8 PROGRAMMING NEWS MANAGER */}
          {activeTab === "news" && isAdmin && <AdminNewsTab />}

          {/* 4. ORDERS */}
          {activeTab === "orders" && isAdmin && (
            <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">شماره سفارش</th>
                    <th className="px-4 py-3.5">کاربر</th>
                    <th className="px-4 py-3.5">دوره‌ها</th>
                    <th className="px-4 py-3.5">مبلغ نهایی</th>
                    <th className="px-4 py-3.5">کد رهگیری</th>
                    <th className="px-4 py-3.5">وضعیت سفارش</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70 tabular-nums">
                  {allOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-[#DFE7F2]/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                        <div>{ord.userName}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {ord.userEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {ord.items.map((i) => i.courseTitle).join("، ")}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatToman(ord.finalAmount)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {ord.paymentRef || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          aria-label={`وضعیت سفارش ${ord.orderNumber}`}
                          value={ord.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(
                              ord.id,
                              e.target.value as OrderStatus
                            )
                          }
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="PENDING">در انتظار</option>
                          <option value="COMPLETED">پرداخت موفق</option>
                          <option value="FAILED">ناموفق</option>
                          <option value="REFUNDED">مرجوع‌شده</option>
                          <option value="CANCELLED">لغو‌شده</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. REVIEWS MODERATION */}
          {activeTab === "reviews" && isAdmin && (
            <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">کاربر / نقش</th>
                    <th className="px-4 py-3.5">دوره</th>
                    <th className="px-4 py-3.5">امتیاز</th>
                    <th className="px-4 py-3.5">متن دیدگاه</th>
                    <th className="px-4 py-3.5">وضعیت</th>
                    <th className="px-4 py-3.5">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70 tabular-nums">
                  {reviews.map((rev) => (
                    <tr
                      key={rev.id}
                      className="hover:bg-[#DFE7F2]/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rev.userName}
                        </div>
                        <span className="text-[10px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                          {rev.authorRole === "ADMIN"
                            ? "مدیریت"
                            : rev.authorRole === "INSTRUCTOR"
                            ? "مدرس"
                            : "دانشجو"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--accent-700)] dark:text-[var(--accent-400)] max-w-[180px] truncate">
                        {rev.courseTitle || rev.courseId}
                      </td>
                      <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 font-bold">
                        {toPersianDigits(rev.rating)} / ۵
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-sm">
                        {rev.comment}
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        <span
                          className={
                            rev.status === "APPROVED"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : rev.status === "REJECTED"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-amber-700 dark:text-amber-400"
                          }
                        >
                          {rev.status === "APPROVED"
                            ? "تاییدشده"
                            : rev.status === "REJECTED"
                            ? "ردشده"
                            : "در انتظار"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label="تایید دیدگاه"
                            onClick={() =>
                              handleModerateReview(rev.id, "APPROVED")
                            }
                            className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="رد دیدگاه"
                            onClick={() =>
                              handleModerateReview(rev.id, "REJECTED")
                            }
                            className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-amber-600 dark:text-amber-400 hover:border-amber-500"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="حذف دیدگاه"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 hover:border-rose-500 hover:text-rose-500"
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

          {/* 6. COUPONS */}
          {activeTab === "coupons" && isAdmin && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
              <form
                onSubmit={handleCreateCoupon}
                className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-5 space-y-4"
              >
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  ساخت کد تخفیف
                </h2>
                <div>
                  <label
                    htmlFor="cpn-code"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="cpn-type"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      نوع تخفیف
                    </label>
                    <select
                      id="cpn-type"
                      value={couponType}
                      onChange={(e) =>
                        setCouponType(e.target.value as "PERCENTAGE" | "FIXED")
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="PERCENTAGE">درصدی (٪)</option>
                      <option value="FIXED">مبلغ ثابت (تومان)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="cpn-val"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      مقدار
                    </label>
                    <input
                      id="cpn-val"
                      type="number"
                      min={1}
                      value={couponValue}
                      onChange={(e) => setCouponValue(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="cpn-max"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    سقف تعداد استفاده
                  </label>
                  <input
                    id="cpn-max"
                    type="number"
                    min={1}
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-3d w-full rounded-xl py-2.5 text-xs font-bold"
                >
                  ایجاد کد تخفیف
                </button>
              </form>

              <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">کد</th>
                      <th className="px-4 py-3">مقدار</th>
                      <th className="px-4 py-3">مصرف</th>
                      <th className="px-4 py-3">وضعیت</th>
                      <th className="px-4 py-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70 tabular-nums">
                    {coupons.map((cpn) => (
                      <tr key={cpn.id}>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {cpn.code}
                        </td>
                        <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-bold">
                          {cpn.type === "PERCENTAGE"
                            ? `${toPersianDigits(cpn.value)}٪`
                            : formatToman(cpn.value)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
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
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-[#DFE7F2] dark:bg-slate-800 text-slate-600 dark:text-slate-400"
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
                            className="text-slate-500 hover:text-rose-500"
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

          {/* 7. USERS & MANUAL ENROLLMENT */}
          {activeTab === "users" && isAdmin && (
            <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950/60 text-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">نام کاربر</th>
                    <th className="px-4 py-3.5">ایمیل / موبایل</th>
                    <th className="px-4 py-3.5">نقش</th>
                    <th className="px-4 py-3.5">وضعیت حساب</th>
                    <th className="px-4 py-3.5">دوره‌های فعال</th>
                    <th className="px-4 py-3.5">اعطای دستی دسترسی دوره</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/70 dark:divide-slate-800/70 tabular-nums">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        <div>{u.email || "—"}</div>
                        {u.phone && (
                          <div className="text-[10px]">{u.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          aria-label={`نقش کاربر ${u.name}`}
                          value={u.role}
                          onChange={(e) =>
                            handleToggleRole(
                              u.id,
                              e.target.value as
                                | "ADMIN"
                                | "INSTRUCTOR"
                                | "STUDENT"
                            )
                          }
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="STUDENT">دانشجو</option>
                          <option value="INSTRUCTOR">مدرس</option>
                          <option value="ADMIN">مدیر سیستم</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleUserStatus(u.id, u.isActive === false)
                          }
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            u.isActive !== false
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {u.isActive !== false ? "فعال" : "مسدود"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-emerald-700 dark:text-emerald-400 font-bold">
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
                            className="max-w-[200px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-200"
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
                            className="rounded-lg bg-[var(--accent-600)] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[var(--accent-500)] shrink-0"
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

          {/* 8. PLATFORM SETTINGS */}
          {activeTab === "settings" && isAdmin && <AdminSettingsTab />}
        </>
      )}

      {/* COURSE & CURRICULUM BUILDER MODAL */}
      {courseModalOpen && courseForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="ویرایشگر دوره، قیمت‌گذاری و سرفصل‌ها"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 px-6 py-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {courseForm.id
                  ? "ویرایش دوره، تخفیف‌ها و سهم مدرس"
                  : "ایجاد دوره جدید"}
              </h2>
              <button
                type="button"
                aria-label="بستن ویرایشگر دوره"
                onClick={() => setCourseModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-[#E2E8F0] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    عنوان دوره *
                  </label>
                  <input
                    id="course-title"
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-category"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    دپارتمان تخصصی
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
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
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="ALL_LEVELS">مقدماتی تا پیشرفته</option>
                    <option value="BEGINNER">مقدماتی</option>
                    <option value="INTERMEDIATE">متوسط</option>
                    <option value="ADVANCED">پیشرفته</option>
                  </select>
                </div>

                {/* Pricing & Quick Discount Panel */}
                <div className="sm:col-span-2 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950/60 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                    <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>قیمت‌گذاری دوره، تخفیف و تنظیم سهم مدرس</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="course-price"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="course-discount"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        قیمت با تخفیف دوره (اختیاری)
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
                        placeholder="خالی = بدون تخفیف"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Quick % Discount Helpers */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold ml-1">
                      تخفیف سریع:
                    </span>
                    {[10, 20, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setCourseForm({
                            ...courseForm,
                            discountPrice: String(
                              Math.round((courseForm.price * (100 - pct)) / 100)
                            ),
                          })
                        }
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-900 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                      >
                        {toPersianDigits(pct)}٪ تخفیف
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCourseForm({ ...courseForm, discountPrice: "" })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-rose-500"
                    >
                      حذف تخفیف
                    </button>
                  </div>

                  {/* Instructor Share & Commission Discount */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-300/80 dark:border-slate-800 pt-3">
                    <div>
                      <label
                        htmlFor="course-inst-share"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        درصد سهم پایه مدرس (٪)
                      </label>
                      <input
                        id="course-inst-share"
                        type="number"
                        min={0}
                        max={100}
                        value={courseForm.instructorSharePercent}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            instructorSharePercent: Math.min(
                              100,
                              Math.max(0, Number(e.target.value))
                            ),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="course-inst-discount"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        تخفیف / کسر از سهم مدرس (٪)
                      </label>
                      <input
                        id="course-inst-discount"
                        type="number"
                        min={0}
                        max={100}
                        value={courseForm.instructorDiscountPercent}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            instructorDiscountPercent: Math.min(
                              100,
                              Math.max(0, Number(e.target.value))
                            ),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-[var(--accent-700)] dark:text-[var(--accent-300)] tabular-nums">
                    سهم خالص قابل پرداخت به مدرس از هر فروش:{" "}
                    {toPersianDigits(
                      Math.max(
                        0,
                        courseForm.instructorSharePercent -
                          courseForm.instructorDiscountPercent
                      )
                    )}
                    ٪
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="course-instructor"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="course-duration"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Thumbnail */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="course-thumbnail-preset"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    تصویر کاور دوره
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <img
                      src={resolveCourseThumbnail(courseForm.thumbnail)}
                      alt={courseForm.title || "پیش‌نمایش کاور"}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                      }}
                      className="h-14 w-24 rounded-xl object-cover border border-slate-300 dark:border-slate-800 bg-slate-950 shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          id="course-thumbnail-preset"
                          value={
                            COURSE_THUMBNAIL_PRESETS.some(
                              (p) => p.legacyPath === courseForm.thumbnail
                            )
                              ? courseForm.thumbnail
                              : "custom"
                          }
                          onChange={(e) => {
                            if (e.target.value !== "custom") {
                              setCourseForm({
                                ...courseForm,
                                thumbnail: e.target.value,
                              });
                            }
                          }}
                          className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                        >
                          {COURSE_THUMBNAIL_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.legacyPath}>
                              طرح آماده: {preset.label}
                            </option>
                          ))}
                          <option value="custom">آدرس تصویر دلخواه</option>
                        </select>
                        <input
                          id="course-thumbnail-url"
                          type="text"
                          dir="ltr"
                          aria-label="آدرس تصویر کاور دوره"
                          value={courseForm.thumbnail}
                          onChange={(e) =>
                            setCourseForm({
                              ...courseForm,
                              thumbnail: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-[var(--accent-700)] dark:text-indigo-300 hover:border-[var(--accent-500)]">
                        <Upload className="h-3.5 w-3.5" />
                        <span>
                          {uploadingThumbnail
                            ? "در حال آپلود..."
                            : "آپلود فایل تصویر کاور"}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingThumbnail}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleThumbnailUpload(file);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="course-shortdesc"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    معرفی کوتاه *
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="course-desc"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <input
                      type="checkbox"
                      checked={courseForm.fullAccess}
                      onChange={(e) =>
                        setCourseForm({
                          ...courseForm,
                          fullAccess: e.target.checked,
                        })
                      }
                    />
                    <span>فعال‌سازی دسترسی کامل (Full Access)</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Curriculum Builder */}
              <div className="border-t border-slate-300 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[var(--accent-700)] dark:text-[var(--accent-400)]">
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
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[var(--accent-600)]"
                  >
                    + افزودن فصل
                  </button>
                </div>

                {courseForm.chapters.map((ch, cIdx) => (
                  <div
                    key={ch.id}
                    className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-950/60 p-3.5 space-y-2.5"
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
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
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
                                attachments: [],
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
                        className="p-1.5 text-slate-500 hover:text-rose-500"
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
                          className="flex-1 min-w-[160px] rounded-lg border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200"
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
                          className="w-20 rounded-lg border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-200 text-center"
                        />
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
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
                          className="p-1 text-slate-500 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-300 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="btn-3d-secondary rounded-xl px-5 py-2.5 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="btn-3d rounded-xl px-6 py-2.5 text-xs font-bold disabled:opacity-50"
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
