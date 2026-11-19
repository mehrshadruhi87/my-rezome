import React from "react";
import { Link } from "../../router";
import { useAuth } from "../../context/AuthContext";
import {
  Award,
  Code2,
  Instagram,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";

export function Footer() {
  const { settings } = useAuth();

  return (
    <footer className="border-t border-slate-300/80 dark:border-slate-800/80 bg-[#E9EFF6] dark:bg-slate-950 text-slate-700 dark:text-slate-400 transition-colors">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-600)] text-white">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {settings.brandPrimaryText}
                <span className="text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                  {settings.brandAccentText}
                </span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {settings.footerTagline}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
              مسیرهای یادگیری
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/courses?category=frontend"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  متخصص فرانت‌اند و Next.js
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?category=ui-ux-figma"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  طراحی رابط کاربری و فیگما
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?category=wordpress"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  طراحی سایت با وردپرس
                </Link>
              </li>
              <li>
                <Link
                  href="/courses?category=ai-data"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  مهندسی هوش مصنوعی و LLM
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
              دسترسی سریع
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/courses"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  کاتالوگ تمام دوره‌ها
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmaps"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  نقشه‌های راه تعاملی
                </Link>
              </li>
              <li>
                <Link
                  href="/code-lab"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  آزمایشگاه اجرای زنده کد
                </Link>
              </li>
              <li>
                <Link
                  href="/challenges"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  چالش‌های روزانه و امتیازدهی
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)]"
                >
                  سبد خرید و علاقه‌مندی‌ها
                </Link>
              </li>
            </ul>
          </div>

          {settings.showTrustBadges && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                نمادهای اعتماد و ضمانت
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-300/80 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900/60 p-3 text-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    پرداخت امن شاپرک
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-500">
                    ضمانت بازگشت وجه
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-300/80 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900/60 p-3 text-center">
                  <Award className="h-6 w-6 text-[var(--accent-600)] dark:text-[var(--accent-400)] mb-1" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    گواهینامه معتبر
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-500">
                    قابل استعلام آنلاین
                  </span>
                </div>
              </div>
            </div>
          )}

          {settings.showDeveloperInfo && (
            <div className="min-w-0">
              <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                توسعه‌دهنده و ارتباط
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-semibold">
                  <User className="h-3.5 w-3.5 text-[var(--accent-600)] dark:text-[var(--accent-400)] shrink-0" />
                  <span>توسعه‌دهنده: {settings.developerName}</span>
                </li>
                <li className="flex items-center gap-2 min-w-0">
                  <Mail className="h-3.5 w-3.5 text-[var(--accent-600)] dark:text-[var(--accent-400)] shrink-0" />
                  <a
                    href={`mailto:${settings.developerEmail}`}
                    dir="ltr"
                    className="font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] truncate transition-colors"
                  >
                    {settings.developerEmail}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <a
                    href={`tel:${settings.developerPhone}`}
                    dir="ltr"
                    className="font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 tabular-nums transition-colors"
                  >
                    {settings.developerPhone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Instagram className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <a
                    href={`https://instagram.com/${settings.developerInstagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
                  >
                    <span>اینستاگرام:</span>
                    <span dir="ltr" className="font-mono text-[11px]">
                      {settings.developerInstagram}
                    </span>
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Send className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <a
                    href={`https://t.me/${settings.developerTelegram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors"
                  >
                    <span>تلگرام:</span>
                    <span dir="ltr" className="font-mono text-[11px]">
                      {settings.developerTelegram}
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-slate-300/80 dark:border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-500">
          <p>{settings.copyrightText}</p>
          <p className="mt-2 sm:mt-0">آکادمی تخصصی مهندسی نرم‌افزار</p>
        </div>
      </div>
    </footer>
  );
}
