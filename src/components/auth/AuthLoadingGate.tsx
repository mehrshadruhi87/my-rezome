import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface AuthLoadingGateProps {
  message?: string;
}

export function AuthLoadingGate({
  message = "در حال بررسی نشست کاربری...",
}: AuthLoadingGateProps) {
  return (
    <div
      data-testid="auth-loading-gate"
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[calc(100vh-180px)] max-w-xl items-center justify-center px-4 py-16"
    >
      <div className="glass-surface relative flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl border border-slate-300/80 dark:border-cyan-500/25 bg-white/85 dark:bg-slate-900/80 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-500)]/80 to-transparent"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-500)]/20 to-cyan-500/15 text-[var(--accent-600)] dark:text-cyan-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {message}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>همگام‌سازی ایمن با احراز هویت کدآکادمی</span>
          </p>
        </div>
      </div>
    </div>
  );
}
