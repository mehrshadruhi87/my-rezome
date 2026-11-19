import React, { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { ApiError, apiRequest } from "../lib/api";
import {
  formatPersianDate,
  formatToman,
  toPersianDigits,
} from "../utils/formatters";
import {
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../data/courseAssets";
import type { CourseSummary, OrderRecord, PublicUser } from "../types";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Heart,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  PlayCircle,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";

interface SessionSummary {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface EnrolledCourse extends CourseSummary {
  chaptersCount: number;
  lessonsCount: number;
}

export function DashboardPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const { wishlist, toggleWishlist, addToCart, setCartDrawerOpen } = useStore();
  const searchParams = useSearchParams();
  const { push } = useRouter();

  const initialTab =
    (searchParams.get("tab") as "enrolled" | "wishlist" | "orders" | "profile") ||
    "enrolled";
  const [activeTab, setActiveTab] = useState<
    "enrolled" | "wishlist" | "orders" | "profile"
  >(initialTab);

  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Email Verification
  const [verifyOtpSent, setVerifyOtpSent] = useState(false);
  const [verifyOtpCode, setVerifyOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "enrolled" || t === "wishlist" || t === "orders" || t === "profile") {
      setActiveTab(t);
    }
  }, [searchParams]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiRequest<{ sessions: SessionSummary[] }>(
        "/api/auth/sessions"
      );
      setSessions(res.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingData(true);
    apiRequest<{
      user: PublicUser;
      enrolledCourses: EnrolledCourse[];
      orders: OrderRecord[];
    }>("/api/student/dashboard")
      .then((res) => {
        if (!active) return;
        setEnrolledCourses(res.enrolledCourses);
        setOrders(res.orders);
        setProfileName(res.user.name);
        setProfilePhone(res.user.phone || "");
        setProfileBio(res.user.bio || "");
      })
      .catch((err) => {
        if (!active) return;
        toast.error(
          err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات پنل"
        );
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (user && activeTab === "profile") {
      loadSessions();
    }
  }, [user, activeTab]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-64 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-4">
          <User className="mx-auto h-10 w-10 text-indigo-400" />
          <h1 className="text-lg font-black text-white">
            دسترسی به پنل دانشجو
          </h1>
          <p className="text-xs text-slate-400">
            برای مشاهده دوره‌های ثبت‌نام‌شده و سوابق خرید، وارد حساب کاربری خود شوید.
          </p>
          <Link
            href="/auth/login?redirect=/dashboard"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white"
          >
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          bio: profileBio,
        }),
      });
      setUser(res.user);
      toast.success("اطلاعات پروفایل با موفقیت به‌روزرسانی شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره پروفایل");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestEmailVerify = async () => {
    setVerifyingEmail(true);
    try {
      const res = await apiRequest<{ sentTo: string; devOtpPreview?: string }>(
        "/api/auth/verify/request",
        {
          method: "POST",
          body: JSON.stringify({ channel: "email" }),
        }
      );
      setVerifyOtpSent(true);
      if (res.devOtpPreview) {
        setDevOtpHint(res.devOtpPreview);
      }
      toast.success("کد تایید به ایمیل شما ارسال شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ارسال کد تایید");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleConfirmEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingEmail(true);
    try {
      const res = await apiRequest<{ user: PublicUser }>("/api/auth/verify/confirm", {
        method: "POST",
        body: JSON.stringify({ channel: "email", code: verifyOtpCode.trim() }),
      });
      setUser(res.user);
      setVerifyOtpSent(false);
      setVerifyOtpCode("");
      setDevOtpHint(null);
      toast.success("ایمیل شما با موفقیت تایید شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "کد تایید نامعتبر است.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await apiRequest("/api/auth/password/change", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("رمز عبور شما با موفقیت تغییر یافت.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تغییر رمز عبور");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    try {
      await apiRequest(`/api/auth/sessions/${sessionId}`, { method: "DELETE" });
      if (isCurrent) {
        setUser(null);
        toast.info("نشست فعلی بسته شد.");
        return;
      }
      toast.success("نشست با موفقیت بسته شد.");
      await loadSessions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بستن نشست");
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      await apiRequest("/api/auth/logout-all", { method: "POST" });
      setUser(null);
      toast.success("تمامی نشست‌های فعال بسته شدند.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا");
    }
  };

  const statusLabel = (status: string) => {
    if (status === "COMPLETED")
      return { text: "پرداخت موفق", cls: "text-emerald-400" };
    if (status === "FAILED")
      return { text: "ناموفق", cls: "text-rose-400" };
    if (status === "REFUNDED")
      return { text: "مرجوع شده", cls: "text-sky-400" };
    if (status === "CANCELLED")
      return { text: "لغو شده", cls: "text-slate-400" };
    return { text: "در انتظار پرداخت", cls: "text-amber-400" };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white">
            پنل کاربری · {user.name}
          </h1>
          <p className="mt-1 text-xs text-slate-400">{user.email}</p>
        </div>
        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>ورود به کنسول مدیریت</span>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="بخش‌های پنل دانشجو"
        className="flex flex-wrap gap-2 border-b border-slate-800 pb-4"
      >
        {[
          {
            id: "enrolled" as const,
            label: `دوره‌های من (${toPersianDigits(enrolledCourses.length)})`,
            icon: BookOpen,
          },
          {
            id: "wishlist" as const,
            label: `علاقه‌مندی‌ها (${toPersianDigits(wishlist.length)})`,
            icon: Heart,
          },
          {
            id: "orders" as const,
            label: `سفارش‌ها (${toPersianDigits(orders.length)})`,
            icon: Receipt,
          },
          { id: "profile" as const, label: "پروفایل کاربری", icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.id);
                push(`/dashboard?tab=${tab.id}`);
              }}
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

      {/* Tab Content */}
      {activeTab === "enrolled" && (
        <div>
          {loadingData ? (
            <div className="h-48 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
          ) : enrolledCourses.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-3">
              <p className="text-sm font-bold text-white">
                هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید
              </p>
              <Link
                href="/courses"
                className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white"
              >
                مرور دوره‌های آموزشی
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 flex flex-col"
                >
                  <img
                    src={resolveCourseThumbnail(course.thumbnail)}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                    }}
                    className="aspect-video w-full object-cover bg-slate-950"
                  />
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-400 mb-1">
                        دسترسی فعال · {toPersianDigits(course.lessonsCount)} جلسه
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        مدرس: {course.instructorName}
                      </p>
                    </div>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>ورود به کلاس و مشاهده ویدیوها</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "wishlist" && (
        <div>
          {wishlist.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-3">
              <p className="text-sm font-bold text-white">
                لیست علاقه‌مندی‌های شما خالی است
              </p>
              <Link
                href="/courses"
                className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white"
              >
                کشف دوره‌های جدید
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 p-4 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveCourseThumbnail(item.thumbnail)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                      }}
                      className="h-16 w-24 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/courses/${item.slug}`}
                        className="text-xs font-bold text-white hover:text-indigo-400 line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <div className="mt-1 text-xs font-bold text-emerald-400 tabular-nums">
                        {formatToman(item.discountPrice ?? item.price)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(item);
                        setCartDrawerOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>افزودن به سبد</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`حذف ${item.title} از علاقه‌مندی‌ها`}
                      onClick={() => toggleWishlist(item)}
                      className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
          {orders.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              هنوز سفارشی ثبت نشده است.
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">شماره سفارش</th>
                  <th className="px-4 py-3.5 font-semibold">دوره‌ها</th>
                  <th className="px-4 py-3.5 font-semibold">تاریخ</th>
                  <th className="px-4 py-3.5 font-semibold">مبلغ نهایی</th>
                  <th className="px-4 py-3.5 font-semibold">کد پیگیری</th>
                  <th className="px-4 py-3.5 font-semibold">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {orders.map((ord) => {
                  const st = statusLabel(ord.status);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate">
                        {ord.items.map((i) => i.courseTitle).join("، ")}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {formatPersianDate(ord.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        {formatToman(ord.finalAmount)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {ord.paymentRef || "—"}
                      </td>
                      <td className={`px-4 py-3.5 font-bold ${st.cls}`}>
                        {st.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-white">ویرایش مشخصات فردی</h2>
            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                نام و نام خانوادگی
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="profile-phone"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                شماره تماس
              </label>
              <input
                id="profile-phone"
                type="tel"
                dir="ltr"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="profile-bio"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                درباره من / مهارت‌ها
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {savingProfile ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </form>

          <div className="space-y-6">
            {/* Email Verification */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  <span>تایید ایمیل حساب</span>
                </h2>
                {user.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    تاییدشده
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-400">
                    در انتظار تایید
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              {!user.isEmailVerified && (
                <div className="space-y-3">
                  {!verifyOtpSent ? (
                    <button
                      type="button"
                      disabled={verifyingEmail}
                      onClick={handleRequestEmailVerify}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {verifyingEmail ? "در حال ارسال..." : "ارسال کد تایید به ایمیل"}
                    </button>
                  ) : (
                    <form onSubmit={handleConfirmEmailVerify} className="space-y-3">
                      {devOtpHint && (
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-indigo-300">
                          کد تایید آزمایشی:{" "}
                          <span className="font-mono font-bold">{devOtpHint}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          required
                          maxLength={6}
                          value={verifyOtpCode}
                          onChange={(e) => setVerifyOtpCode(e.target.value)}
                          placeholder="کد ۶ رقمی"
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-mono text-center tracking-widest"
                        />
                        <button
                          type="submit"
                          disabled={verifyingEmail}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          تایید
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Change Password */}
            <form
              onSubmit={handleChangePassword}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-400" />
                <span>تغییر رمز عبور</span>
              </h2>
              <div>
                <label
                  htmlFor="current-pass"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  رمز عبور فعلی
                </label>
                <input
                  id="current-pass"
                  type="password"
                  required
                  dir="ltr"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="new-pass"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  رمز عبور جدید (حداقل ۶ کاراکتر)
                </label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  minLength={6}
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-5 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white disabled:opacity-50"
              >
                {changingPassword ? "در حال ثبت..." : "به‌روزرسانی رمز عبور"}
              </button>
            </form>

            {/* Active Sessions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>نشست‌های فعال</span>
                </h2>
                <button
                  type="button"
                  onClick={handleLogoutAllSessions}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>خروج از همه دستگاه‌ها</span>
                </button>
              </div>
              {loadingSessions ? (
                <div className="h-20 rounded-xl bg-slate-950/60 animate-pulse" />
              ) : sessions.length === 0 ? (
                <p className="text-xs text-slate-400">نشست فعالی ثبت نشده است.</p>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((ses) => (
                    <div
                      key={ses.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Laptop className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 truncate">
                            {ses.userAgent || "مرورگر وب"}
                            {ses.isCurrent && (
                              <span className="mr-2 text-[10px] text-emerald-400">
                                (نشست فعلی)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ایجاد: {formatPersianDate(ses.createdAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(ses.id, ses.isCurrent)}
                        className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:border-rose-500 hover:text-rose-400 shrink-0"
                      >
                        بستن
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
