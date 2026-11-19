import React, { useState } from "react";
import { motion } from "motion/react";
import { Link, useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { AuthAnimatedBackdrop } from "../components/auth/AuthAnimatedBackdrop";
import { apiRequest } from "../lib/api";
import { toast } from "sonner";
import {
  AtSign,
  Briefcase,
  CheckCircle2,
  Code2,
  FileText,
  GraduationCap,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";

type AuthViewMode = "login" | "register" | "instructor" | "forgot" | "reset";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register, registerInstructor, settings } = useAuth();
  const { isReducedMotion } = useUserPreferences();
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const [spotlight, setSpotlight] = useState({ x: 50, y: 38, active: false });

  const initialTab =
    searchParams.get("tab") === "instructor" ? "instructor" : mode;
  const [viewMode, setViewMode] = useState<AuthViewMode>(initialTab);
  const [prevPropMode, setPrevPropMode] = useState(mode);
  if (mode !== prevPropMode) {
    setPrevPropMode(mode);
    setViewMode(searchParams.get("tab") === "instructor" ? "instructor" : mode);
  }

  // Common fields
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // login: email / phone / username
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Instructor fields
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [instructorSubmitted, setInstructorSubmitted] = useState(false);

  // Password reset fields
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devResetHint, setDevResetHint] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Distinct color themes per mode so Login / Student Register / Instructor Register feel unmistakably different
  const themeConfig =
    viewMode === "register"
      ? {
          accentBg: "bg-emerald-600 hover:bg-emerald-500",
          accentBadge:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          cardRing:
            "border-emerald-500/35 dark:border-emerald-500/30 shadow-emerald-950/15",
          glowA: "rgba(16, 185, 129, 0.22)",
          glowB: "rgba(20, 184, 166, 0.16)",
          iconBg: "bg-emerald-600",
          focusBorder: "focus:border-emerald-500",
          title: "ثبت‌نام دانشجوی جدید",
          subtitle:
            "عضویت سریع با نام کاربری یا شماره موبایل (وارد کردن ایمیل اختیاری است)",
        }
      : viewMode === "instructor"
      ? {
          accentBg: "bg-amber-600 hover:bg-amber-500",
          accentBadge:
            "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35",
          cardRing:
            "border-amber-500/40 dark:border-amber-500/30 shadow-amber-950/15",
          glowA: "rgba(245, 158, 11, 0.22)",
          glowB: "rgba(139, 92, 246, 0.16)",
          iconBg: "bg-amber-600",
          focusBorder: "focus:border-amber-500",
          title: "ثبت‌نام مدرس و درخواست تدریس",
          subtitle:
            "درخواست شما ثبت و پس از تایید مدیریت، دسترسی انتشار دوره و آپلود ویدیو فعال می‌شود",
        }
      : {
          accentBg: "btn-3d",
          accentBadge:
            "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
          cardRing:
            "border-indigo-500/35 dark:border-indigo-500/30 shadow-indigo-950/15",
          glowA: "rgba(99, 102, 241, 0.24)",
          glowB: "rgba(6, 182, 212, 0.16)",
          iconBg: "bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)]",
          focusBorder: "focus:border-indigo-500",
          title:
            viewMode === "forgot"
              ? "بازیابی رمز عبور"
              : viewMode === "reset"
              ? "ثبت رمز عبور جدید"
              : "ورود به حساب کدآکادمی",
          subtitle:
            viewMode === "login"
              ? "با ایمیل، شماره موبایل یا نام کاربری خود وارد شوید"
              : "کد تایید بازیابی به ایمیل ثبت‌شده ارسال می‌شود",
        };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (viewMode === "login") {
        if (!identifier.trim()) {
          throw new Error("لطفاً ایمیل، شماره موبایل یا نام کاربری را وارد کنید.");
        }
        const loggedUser = await login(identifier.trim(), password);
        toast.success(`خوش آمدید، ${loggedUser.name}`);
        if (
          (loggedUser.role === "ADMIN" || loggedUser.role === "INSTRUCTOR") &&
          redirectTarget === "/dashboard"
        ) {
          push("/admin");
        } else {
          push(redirectTarget);
        }
      } else if (viewMode === "register") {
        if (!name.trim()) {
          throw new Error("لطفاً نام و نام خانوادگی را وارد کنید.");
        }
        if (!email.trim() && !phone.trim() && !username.trim()) {
          throw new Error(
            "لطفاً حداقل یکی از فیلدهای نام کاربری، شماره موبایل یا ایمیل را وارد کنید."
          );
        }
        if (password.length < 6) {
          throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        }
        const newUser = await register({
          name: name.trim(),
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
        });
        toast.success(`حساب کاربری شما با موفقیت ساخته شد، ${newUser.name}`);
        push(redirectTarget);
      } else if (viewMode === "instructor") {
        if (!name.trim() || !specialty.trim() || !phone.trim()) {
          throw new Error("نام، حوزه تخصص و شماره تماس برای ثبت‌نام مدرس الزامی است.");
        }
        if (password.length < 6) {
          throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        }
        await registerInstructor({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          specialty: specialty.trim(),
          bio: bio.trim(),
          password,
        });
        setInstructorSubmitted(true);
        toast.success(
          "درخواست مدرسی شما با موفقیت ثبت شد و پس از تایید مدیریت فعال می‌گردد."
        );
      } else if (viewMode === "forgot") {
        const res = await apiRequest<{ sent: boolean; devOtpPreview?: string }>(
          "/api/auth/password/forgot",
          {
            method: "POST",
            body: JSON.stringify({ email: email.trim() }),
          }
        );
        if (res.devOtpPreview) {
          setDevResetHint(res.devOtpPreview);
        }
        toast.success("کد بازیابی رمز عبور ارسال شد.");
        setViewMode("reset");
      } else if (viewMode === "reset") {
        await apiRequest("/api/auth/password/reset", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            code: resetCode.trim(),
            newPassword,
          }),
        });
        toast.success("رمز عبور جدید ثبت شد. اکنون وارد شوید.");
        setPassword("");
        setResetCode("");
        setNewPassword("");
        setDevResetHint(null);
        setViewMode("login");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در احراز هویت";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setSpotlight({ x, y, active: true });
  };

  const handleBackdropMouseLeave = () => {
    setSpotlight((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      onMouseMove={handleBackdropMouseMove}
      onMouseLeave={handleBackdropMouseLeave}
      className="relative flex min-h-[calc(100vh-4.25rem)] items-center justify-center overflow-hidden py-12 px-4 sm:py-16"
    >
      {/* Distinct Multi-Layered Animated Aurora, Particles & Interactive Spotlight Backdrop */}
      <AuthAnimatedBackdrop
        spotlightX={spotlight.x}
        spotlightY={spotlight.y}
        spotlightActive={spotlight.active}
      />

      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 mx-auto w-full max-w-lg"
      >
        <div
          className={`relative overflow-hidden rounded-3xl border bg-white/88 dark:bg-slate-900/78 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6 transition-colors duration-300 ${themeConfig.cardRing}`}
        >
          {/* Accent Top-Edge Highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-500)]/75 to-transparent"
          />
          {/* Header */}
          <div className="text-center space-y-2">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-colors ${themeConfig.iconBg}`}
            >
              {viewMode === "instructor" ? (
                <GraduationCap className="h-6 w-6" />
              ) : viewMode === "register" ? (
                <UserPlus className="h-6 w-6" />
              ) : (
                <Code2 className="h-6 w-6" />
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {themeConfig.title}
            </h1>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {themeConfig.subtitle}
            </p>
          </div>

          {/* 3 Contrasting Mode Switcher Tabs */}
          <div
            role="tablist"
            aria-label="حالت احراز هویت"
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950 p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "login"}
              onClick={() => {
                setErrorMsg(null);
                setInstructorSubmitted(false);
                setViewMode("login");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                viewMode === "login"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>ورود</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "register"}
              onClick={() => {
                setErrorMsg(null);
                setInstructorSubmitted(false);
                setViewMode("register");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                viewMode === "register"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>ثبت‌نام دانشجو</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "instructor"}
              onClick={() => {
                setErrorMsg(null);
                setViewMode("instructor");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                viewMode === "instructor"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>ثبت‌نام مدرس</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/12 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}

          {devResetHint && viewMode === "reset" && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
              کد بازیابی:{" "}
              <strong className="font-mono select-all">{devResetHint}</strong>
            </div>
          )}

          {/* Instructor Application Confirmation State */}
          {viewMode === "instructor" && instructorSubmitted ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                درخواست مدرسی شما ثبت شد!
              </h2>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                حساب شما ایجاد شده و درخواست تدریس شما برای بررسی و تایید به پنل مدیریت ارسال گردید. تا پیش از تایید مدیر سیستم، امکان انتشار دوره جدید قفل است؛ بلافاصله پس از تایید، پنل مدرسین برایتان باز خواهد شد.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Link
                  href="/dashboard"
                  className="btn-3d rounded-xl px-5 py-2.5 text-xs font-bold"
                >
                  ورود به پنل کاربری
                </Link>
                <Link
                  href="/"
                  className="btn-3d-secondary rounded-xl px-5 py-2.5 text-xs font-bold"
                >
                  صفحه اصلی
                </Link>
              </div>
            </div>
          ) : (viewMode === "register" || viewMode === "instructor") &&
            !settings.allowRegistration ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
                ثبت‌نام کاربران جدید در حال حاضر توسط مدیریت پلتفرم متوقف شده است.
              </p>
              <button
                type="button"
                onClick={() => setViewMode("login")}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
              >
                بازگشت به صفحه ورود
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* LOGIN VIEW */}
              {viewMode === "login" && (
                <div>
                  <label
                    htmlFor="auth-identifier"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    ایمیل، شماره موبایل یا نام کاربری
                  </label>
                  <div className="relative">
                    <input
                      id="auth-identifier"
                      type="text"
                      required
                      dir="ltr"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com / 0912... / username"
                      className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                    />
                    <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>
              )}

              {/* STUDENT REGISTER VIEW */}
              {viewMode === "register" && (
                <>
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      نام و نام خانوادگی *
                    </label>
                    <div className="relative">
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثلاً: علی رضایی"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="auth-username"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        نام کاربری
                      </label>
                      <div className="relative">
                        <input
                          id="auth-username"
                          type="text"
                          dir="ltr"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="ali_dev"
                          className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-9 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                        />
                        <AtSign className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="auth-phone"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        شماره موبایل
                      </label>
                      <div className="relative">
                        <input
                          id="auth-phone"
                          type="tel"
                          dir="ltr"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="09120000000"
                          className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-9 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                        />
                        <Phone className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-email-optional"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      ایمیل{" "}
                      <span className="font-normal text-emerald-700 dark:text-emerald-400">
                        (اختیاری)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-email-optional"
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com (اختیاری)"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </>
              )}

              {/* INSTRUCTOR REGISTER VIEW */}
              {viewMode === "instructor" && (
                <>
                  <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                    پس از ثبت درخواست، اطلاعات شما برای تایید به مدیریت ارسال می‌شود و تنها پس از تایید نهایی می‌توانید دوره منتشر کنید.
                  </div>

                  <div>
                    <label
                      htmlFor="inst-name"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      نام و نام خانوادگی مدرس *
                    </label>
                    <div className="relative">
                      <input
                        id="inst-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثلاً: مهندس سارا احمدی"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="inst-specialty"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        حوزه تخصص تدریس *
                      </label>
                      <div className="relative">
                        <input
                          id="inst-specialty"
                          type="text"
                          required
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="مثلاً: UI/UX & Figma، React"
                          className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-9 pl-3 text-xs text-slate-900 dark:text-white focus:outline-none ${themeConfig.focusBorder}`}
                        />
                        <Briefcase className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="inst-phone"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        شماره تماس *
                      </label>
                      <div className="relative">
                        <input
                          id="inst-phone"
                          type="tel"
                          required
                          dir="ltr"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="09120000000"
                          className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-9 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                        />
                        <Phone className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="inst-email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      ایمیل{" "}
                      <span className="font-normal text-amber-700 dark:text-amber-400">
                        (اختیاری)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="inst-email"
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="instructor@example.com"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="inst-bio"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      رزومه و سوابق تدریس یا پروژه‌ها
                    </label>
                    <div className="relative">
                      <textarea
                        id="inst-bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="خلاصه‌ای از تجربه حرفه‌ای و دوره‌هایی که قصد ارائه آن را دارید..."
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <FileText className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </>
              )}

              {/* FORGOT / RESET EMAIL */}
              {(viewMode === "forgot" || viewMode === "reset") && (
                <div>
                  <label
                    htmlFor="auth-forgot-email"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    ایمیل حساب کاربری
                  </label>
                  <div className="relative">
                    <input
                      id="auth-forgot-email"
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>
              )}

              {/* PASSWORD FIELD */}
              {(viewMode === "login" ||
                viewMode === "register" ||
                viewMode === "instructor") && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      رمز عبور *
                    </label>
                    {viewMode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setViewMode("forgot");
                        }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        فراموشی رمز عبور؟
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type="password"
                      required
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                    />
                    <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>
              )}

              {/* RESET CODE & NEW PASSWORD */}
              {viewMode === "reset" && (
                <>
                  <div>
                    <label
                      htmlFor="auth-reset-code"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      کد بازیابی ۶ رقمی
                    </label>
                    <div className="relative">
                      <input
                        id="auth-reset-code"
                        type="text"
                        required
                        dir="ltr"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="123456"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                      <KeyRound className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="auth-new-password"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      رمز عبور جدید
                    </label>
                    <div className="relative">
                      <input
                        id="auth-new-password"
                        type="password"
                        required
                        dir="ltr"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                      <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-xl py-3 text-xs font-black text-white shadow-lg transition-all active:translate-y-0.5 disabled:opacity-50 ${themeConfig.accentBg}`}
              >
                {submitting
                  ? "لطفاً صبر کنید..."
                  : viewMode === "login"
                  ? "ورود به حساب کاربری"
                  : viewMode === "register"
                  ? "ایجاد حساب دانشجو"
                  : viewMode === "instructor"
                  ? "ثبت درخواست مدرسی"
                  : viewMode === "forgot"
                  ? "ارسال کد بازیابی"
                  : "تغییر رمز عبور"}
              </button>

              {(viewMode === "forgot" || viewMode === "reset") && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setViewMode("login");
                  }}
                  className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  بازگشت به صفحه ورود
                </button>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
