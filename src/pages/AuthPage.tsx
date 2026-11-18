import React, { useState } from "react";
import { Link, useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Code2, Lock, Mail, Phone, User } from "lucide-react";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register, settings } = useAuth();
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const loggedUser = await login(email, password);
        toast.success(`خوش آمدید، ${loggedUser.name}`);
        push(
          loggedUser.role === "ADMIN" && redirectTarget === "/dashboard"
            ? "/admin"
            : redirectTarget
        );
      } else {
        if (!name.trim()) {
          throw new Error("لطفاً نام و نام خانوادگی را وارد کنید.");
        }
        if (password.length < 6) {
          throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        }
        const newUser = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        });
        toast.success(`حساب کاربری شما با موفقیت ساخته شد، ${newUser.name}`);
        push(redirectTarget);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در احراز هویت";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Code2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-white">
            {mode === "login"
              ? "ورود به حساب کدآکادمی"
              : "ثبت‌نام دانشجوی جدید"}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === "login"
              ? "برای دسترسی به دوره‌ها و پنل کاربری وارد شوید"
              : "عضویت در جامعه مهندسان نرم‌افزار کدآکادمی"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
          <Link
            href={`/auth/login${
              redirectTarget !== "/dashboard"
                ? `?redirect=${encodeURIComponent(redirectTarget)}`
                : ""
            }`}
            className={`rounded-lg py-2 text-center text-xs font-bold transition-colors ${
              mode === "login"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ورود
          </Link>
          <Link
            href={`/auth/register${
              redirectTarget !== "/dashboard"
                ? `?redirect=${encodeURIComponent(redirectTarget)}`
                : ""
            }`}
            className={`rounded-lg py-2 text-center text-xs font-bold transition-colors ${
              mode === "register"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ثبت‌نام
          </Link>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        {mode === "register" && !settings.allowRegistration ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center space-y-3">
            <p className="text-xs font-semibold text-amber-200 leading-relaxed">
              ثبت‌نام کاربران جدید در حال حاضر توسط مدیریت پلتفرم متوقف شده است.
            </p>
            <Link
              href="/auth/login"
              className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
            >
              بازگشت به صفحه ورود
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: علی رضایی"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <User className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-phone"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  شماره موبایل (اختیاری)
                </label>
                <div className="relative">
                  <input
                    id="auth-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09120000000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <Phone className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              ایمیل
            </label>
            <div className="relative">
              <input
                id="auth-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <Mail className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              رمز عبور
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "لطفاً صبر کنید..."
              : mode === "login"
              ? "ورود به حساب کاربری"
              : "ایجاد حساب کاربری"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
