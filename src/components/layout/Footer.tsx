import React from "react";
import { Link } from "../../router";
import { Award, Code2, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-black text-white">
                کد<span className="text-indigo-400">آکادمی</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              کدآکادمی، مرجع تخصصی بوت‌کمپ‌ها و دوره‌های مهندسی نرم‌افزار، هوش مصنوعی، امنیت شبکه و کلود با منتورشیپ مستقیم متخصصین ارشد صنعت.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-white">مسیرهای یادگیری</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/courses?category=frontend" className="hover:text-indigo-400">
                  متخصص فرانت‌اند و Next.js
                </Link>
              </li>
              <li>
                <Link href="/courses?category=backend" className="hover:text-indigo-400">
                  معمار بک‌اند و میکروسرویس
                </Link>
              </li>
              <li>
                <Link href="/courses?category=ai-data" className="hover:text-indigo-400">
                  مهندسی هوش مصنوعی و LLM
                </Link>
              </li>
              <li>
                <Link href="/courses?category=cybersecurity" className="hover:text-indigo-400">
                  امنیت سایبری و تست نفوذ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-white">دسترسی سریع</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/courses" className="hover:text-indigo-400">
                  کاتالوگ تمام دوره‌ها
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-400">
                  پنل کاربری دانشجو
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-indigo-400">
                  سبد خرید
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-indigo-400">
                  ورود مدرسین و دانشجویان
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-white">نمادهای اعتماد و ضمانت</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                <ShieldCheck className="h-6 w-6 text-emerald-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-200">
                  پرداخت امن شاپرک
                </span>
                <span className="text-[10px] text-slate-500">ضمانت بازگشت وجه</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                <Award className="h-6 w-6 text-indigo-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-200">
                  گواهینامه معتبر
                </span>
                <span className="text-[10px] text-slate-500">قابل استعلام آنلاین</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© ۱۴۰۵ تمامی حقوق مادی و معنوی برای پلتفرم آموزشی کدآکادمی محفوظ است.</p>
          <p className="mt-2 sm:mt-0">آکادمی تخصصی مهندسی نرم‌افزار</p>
        </div>
      </div>
    </footer>
  );
}
