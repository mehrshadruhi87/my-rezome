import React, { useState } from "react";
import { motion } from "motion/react";
import { Link, useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { AuthAnimatedBackdrop } from "../components/auth/AuthAnimatedBackdrop";
import { AuthLoadingGate } from "../components/auth/AuthLoadingGate";
import { validateAuthEmail, validateAuthPassword } from "../lib/supabaseAuth";
import { getDictionary } from "../lib/i18n";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";

type AuthViewMode = "login" | "register" | "instructor" | "forgot";

const RECOVERY_SUCCESS_MESSAGE =
  "لینک بازیابی رمز عبور به جیمیل شما ارسال شد. لطفاً صندوق ورودی یا پوشه Spam را بررسی کنید";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const {
    isAuthLoading,
    login,
    register,
    registerInstructor,
    sendPasswordResetEmail,
    settings,
  } = useAuth();
  const { language, isReducedMotion } = useUserPreferences();
  const t = getDictionary(language);
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const [spotlight, setSpotlight] = useState({ x: 50, y: 38, active: false });

  const initialTab: AuthViewMode =
    searchParams.get("tab") === "instructor" ? "instructor" : mode;
  const [viewMode, setViewMode] = useState<AuthViewMode>(initialTab);
  const [prevPropMode, setPrevPropMode] = useState(mode);
  if (mode !== prevPropMode) {
    setPrevPropMode(mode);
    setViewMode(searchParams.get("tab") === "instructor" ? "instructor" : mode);
  }

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Instructor fields
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [instructorSubmitted, setInstructorSubmitted] = useState(false);

  // Password recovery confirmation state
  const [recoverySentEmail, setRecoverySentEmail] = useState<string | null>(
    null
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const themeConfig =
    viewMode === "register"
      ? {
          accentBg: "bg-emerald-600 hover:bg-emerald-500",
          cardRing:
            "border-emerald-500/35 dark:border-emerald-500/30 shadow-emerald-950/15",
          iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
          focusBorder: "focus:border-emerald-500",
          title: t.auth.registerTitle,
          subtitle: t.auth.registerSub,
        }
      : viewMode === "instructor"
      ? {
          accentBg: "bg-amber-600 hover:bg-amber-500",
          cardRing:
            "border-amber-500/40 dark:border-amber-500/30 shadow-amber-950/15",
          iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
          focusBorder: "focus:border-amber-500",
          title: t.auth.instructorTitle,
          subtitle: t.auth.instructorSub,
        }
      : {
          accentBg: "btn-3d",
          cardRing:
            "border-indigo-500/35 dark:border-indigo-500/30 shadow-indigo-950/15",
          iconBg:
            "bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)]",
          focusBorder: "focus:border-indigo-500",
          title:
            viewMode === "forgot" ? t.auth.forgotTitle : t.auth.loginTitle,
          subtitle:
            viewMode === "forgot" ? t.auth.forgotSub : t.auth.loginSub,
        };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (viewMode === "login") {
        const emailCheck = validateAuthEmail(email);
        if (!emailCheck.valid) {
          throw new Error(emailCheck.error || "لطفاً آدرس ایمیل معتبر وارد کنید.");
        }
        if (!password) {
          throw new Error("لطفاً رمز عبور خود را وارد کنید.");
        }
        const loggedUser = await login(emailCheck.normalized, password);
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
          throw new Error("لطفاً نام و نام خانوادگی خود را وارد کنید.");
        }
        const emailCheck = validateAuthEmail(email);
        if (!emailCheck.valid) {
          throw new Error(emailCheck.error || "لطفاً آدرس ایمیل معتبر وارد کنید.");
        }
        const passCheck = validateAuthPassword(password);
        if (!passCheck.valid) {
          throw new Error(
            passCheck.error || "رمز عبور باید حداقل ۶ کاراکتر باشد."
          );
        }
        const newUser = await register({
          name: name.trim(),
          email: emailCheck.normalized,
          phone: phone.trim() || undefined,
          password,
        });
        toast.success(
          `خوش آمدید، ${newUser.name}! حساب کاربری شما با موفقیت ساخته شد.`
        );
        push(redirectTarget);
      } else if (viewMode === "instructor") {
        if (!name.trim() || !specialty.trim() || !phone.trim()) {
          throw new Error(
            "نام، حوزه تخصص و شماره تماس برای ثبت‌نام مدرس الزامی است."
          );
        }
        const emailCheck = validateAuthEmail(email);
        if (!emailCheck.valid) {
          throw new Error(emailCheck.error || "لطفاً آدرس ایمیل معتبر وارد کنید.");
        }
        const passCheck = validateAuthPassword(password);
        if (!passCheck.valid) {
          throw new Error(
            passCheck.error || "رمز عبور باید حداقل ۶ کاراکتر باشد."
          );
        }
        await registerInstructor({
          name: name.trim(),
          email: emailCheck.normalized,
          phone: phone.trim(),
          specialty: specialty.trim(),
          bio: bio.trim(),
          password,
        });
        setInstructorSubmitted(true);
        toast.success(
          "حساب کاربری و درخواست مدرسی شما ثبت شد و پس از تایید مدیریت فعال می‌گردد."
        );
      } else if (viewMode === "forgot") {
        const emailCheck = validateAuthEmail(email);
        if (!emailCheck.valid) {
          throw new Error(
            emailCheck.error || "لطفاً یک آدرس جیمیل معتبر وارد کنید."
          );
        }
        await sendPasswordResetEmail(emailCheck.normalized);
        setRecoverySentEmail(emailCheck.normalized);
        toast.success(RECOVERY_SUCCESS_MESSAGE);
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
    const x = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
    );
    setSpotlight({ x, y, active: true });
  };

  const handleBackdropMouseLeave = () => {
    setSpotlight((prev) => ({ ...prev, active: false }));
  };

  if (isAuthLoading) {
    return (
      <div className="-mt-16 sm:-mt-20 min-h-screen pt-16 sm:pt-20 bg-[var(--site-bg)]">
        <AuthLoadingGate message="در حال بررسی وضعیت ورود شما..." />
      </div>
    );
  }

  return (
    <div
      data-testid="auth-page-container"
      onMouseMove={handleBackdropMouseMove}
      onMouseLeave={handleBackdropMouseLeave}
      className="relative -mt-16 sm:-mt-20 flex min-h-screen items-center justify-center overflow-hidden bg-[var(--site-bg)] pt-24 pb-12 px-4 sm:pt-28 sm:pb-16"
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
              ) : viewMode === "forgot" ? (
                <KeyRound className="h-6 w-6" />
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
                setRecoverySentEmail(null);
                setViewMode("login");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                viewMode === "login"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{t.auth.tabLogin}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "register"}
              onClick={() => {
                setErrorMsg(null);
                setInstructorSubmitted(false);
                setRecoverySentEmail(null);
                setViewMode("register");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                viewMode === "register"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{t.auth.tabRegister}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "instructor"}
              onClick={() => {
                setErrorMsg(null);
                setRecoverySentEmail(null);
                setViewMode("instructor");
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                viewMode === "instructor"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>{t.auth.tabInstructor}</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              data-testid="auth-error-alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/12 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
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
          ) : viewMode === "forgot" && recoverySentEmail ? (
            <div
              data-testid="recovery-sent-confirmation"
              className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                ایمیل بازیابی ارسال شد
              </h2>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {RECOVERY_SUCCESS_MESSAGE}
              </p>
              <p
                dir="ltr"
                className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300"
              >
                {recoverySentEmail}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setRecoverySentEmail(null);
                    setViewMode("login");
                  }}
                  className="btn-3d rounded-xl px-5 py-2.5 text-xs font-bold"
                >
                  بازگشت به صفحه ورود
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setRecoverySentEmail(null);
                  }}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70"
                >
                  ارسال مجدد
                </button>
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
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* LOGIN VIEW */}
              {viewMode === "login" && (
                <div>
                  <label
                    htmlFor="auth-login-email"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t.auth.emailLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-login-email"
                      type="email"
                      required
                      autoComplete="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                    />
                    <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
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
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثلاً: علی رضایی"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-register-email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      ایمیل *
                    </label>
                    <div className="relative">
                      <input
                        id="auth-register-email"
                        type="email"
                        required
                        autoComplete="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-phone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      شماره موبایل{" "}
                      <span className="font-normal text-emerald-700 dark:text-emerald-400">
                        (اختیاری)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-phone"
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09120000000"
                        className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                      />
                      <Phone className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
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
                      ایمیل *
                    </label>
                    <div className="relative">
                      <input
                        id="inst-email"
                        type="email"
                        required
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="instructor@gmail.com"
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

              {/* FORGOT PASSWORD (REAL GMAIL RECOVERY LINK) */}
              {viewMode === "forgot" && (
                <div>
                  <label
                    htmlFor="auth-forgot-email"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    آدرس جیمیل / ایمیل حساب کاربری *
                  </label>
                  <div className="relative">
                    <input
                      id="auth-forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
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
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t.auth.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete={
                        viewMode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      className={`w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-10 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${themeConfig.focusBorder}`}
                    />
                    <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
                      }
                      className="absolute left-2.5 top-2 p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Forgot Password Link — Cleanly Right-Aligned Directly Below Password Input */}
                  {viewMode === "login" && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        data-testid="forgot-password-link"
                        onClick={() => {
                          setErrorMsg(null);
                          setRecoverySentEmail(null);
                          setViewMode("forgot");
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline underline-offset-4 transition-colors"
                      >
                        {t.auth.forgotPasswordLink}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black text-white shadow-lg transition-all active:translate-y-0.5 disabled:opacity-60 ${themeConfig.accentBg}`}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {submitting
                    ? viewMode === "forgot"
                      ? t.auth.sendingRecovery
                      : t.auth.pleaseWait
                    : viewMode === "login"
                    ? t.auth.submitLogin
                    : viewMode === "register"
                    ? t.auth.submitRegister
                    : viewMode === "instructor"
                    ? t.auth.submitInstructor
                    : t.auth.submitForgot}
                </span>
              </button>

              {viewMode === "forgot" && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setRecoverySentEmail(null);
                    setViewMode("login");
                  }}
                  className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {t.auth.backToLogin}
                </button>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
