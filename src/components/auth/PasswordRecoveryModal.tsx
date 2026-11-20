import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from "lucide-react";

export function PasswordRecoveryModal() {
  const {
    isPasswordRecoveryOpen,
    closePasswordRecovery,
    updateUserPassword,
  } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("رمز عبور جدید شما با موفقیت ثبت شد.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "خطا در تغییر رمز عبور جدید";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isPasswordRecoveryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-recovery-title"
          data-testid="password-recovery-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePasswordRecovery}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-300/80 dark:border-white/15 bg-white/95 dark:bg-slate-900/92 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-500)]/80 to-transparent"
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] text-white shadow-lg shadow-[var(--accent-500)]/30">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="password-recovery-title"
                    className="text-base font-black text-slate-900 dark:text-white"
                  >
                    تغییر رمز عبور جدید
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    رمز عبور جدید خود را برای حساب کدآکادمی وارد و ذخیره کنید
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePasswordRecovery}
                aria-label="بستن پنجره تغییر رمز عبور"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-500/12 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300"
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recovery-new-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  رمز عبور جدید *
                </label>
                <div className="relative">
                  <input
                    id="recovery-new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    dir="ltr"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-10 text-xs text-slate-900 dark:text-white font-mono focus:border-[var(--accent-500)] focus:outline-none"
                  />
                  <Lock className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                    className="absolute left-2.5 top-2 p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="recovery-confirm-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  تکرار رمز عبور جدید *
                </label>
                <div className="relative">
                  <input
                    id="recovery-confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور جدید"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 py-2.5 pr-10 pl-3 text-xs text-slate-900 dark:text-white font-mono focus:border-[var(--accent-500)] focus:outline-none"
                  />
                  <ShieldCheck className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-3d w-full rounded-xl py-3 text-xs font-black text-white disabled:opacity-50"
              >
                {submitting ? "در حال ذخیره رمز عبور..." : "ذخیره رمز عبور جدید"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
