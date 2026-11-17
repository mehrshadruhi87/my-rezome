import React, { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../../router";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../store/useStore";
import { apiRequest } from "../../lib/api";
import { formatToman, toPersianDigits } from "../../utils/formatters";
import type { CourseSummary } from "../../types";
import {
  ChevronDown,
  Code2,
  Heart,
  Layout,
  LogOut,
  Menu,
  Search,
  ShieldAlert,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

export function Header() {
  const { user, categories, logout } = useAuth();
  const { cart, wishlist, setCartDrawerOpen } = useStore();
  const { push } = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CourseSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiRequest<{ courses: CourseSummary[] }>(
          `/api/courses/search?q=${encodeURIComponent(q)}`
        );
        setSearchResults(res.courses);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 240);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 py-3 sm:px-6 lg:px-8">
        {/* Zone 1 & 2: Brand Wordmark + Concise Nav */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              کد<span className="text-indigo-400">آکادمی</span>
            </span>
          </Link>

          <nav
            aria-label="منوی اصلی"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300"
          >
            <div
              className="relative"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMegaMenuOpen((prev) => !prev)}
                aria-expanded={megaMenuOpen}
                className="flex items-center gap-1 py-2 whitespace-nowrap shrink-0 hover:text-white transition-colors"
              >
                <span>دوره‌ها</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    megaMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {megaMenuOpen && (
                <div className="absolute right-0 top-full w-[540px] pt-1.5 z-50">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-bold text-indigo-400">
                        دپارتمان‌های تخصصی
                      </span>
                      <Link
                        href="/courses"
                        onClick={() => setMegaMenuOpen(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        مشاهده همه دوره‌ها ←
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/courses?category=${cat.slug}`}
                          onClick={() => setMegaMenuOpen(false)}
                          className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-800/80 transition-colors"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Layout className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 text-xs truncate">
                              {cat.name}
                            </div>
                            <p className="line-clamp-1 text-[11px] text-slate-400 mt-0.5">
                              {cat.description || "آموزش پروژه‌محور تخصصی"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/courses"
              className="whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 transition-colors"
            >
              کاتالوگ
            </Link>
            <Link
              href="/#roadmaps"
              className="whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 transition-colors"
            >
              نقشه‌های راه
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>پنل مدیریت</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Live Autocomplete Search */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md">
          <div className="relative">
            <input
              type="search"
              aria-label="جستجوی دوره"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setShowDropdown(false);
                  push(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="جستجوی دوره، تکنولوژی یا مدرس..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-9 pl-4 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          {showDropdown && (
            <div className="absolute right-0 left-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  در حال جستجو...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-slate-800/70">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/courses/${item.slug}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-800/70 transition-colors"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="h-11 w-16 rounded-lg object-cover shrink-0 bg-slate-950"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.instructorName} · {item.category.name}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 shrink-0 tabular-nums">
                        {formatToman(item.discountPrice ?? item.price)}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/courses?q=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => setShowDropdown(false)}
                    className="block bg-slate-950/70 py-2.5 text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    مشاهده همه نتایج برای «{searchQuery.trim()}»
                  </Link>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  دوره‌ای با این عبارت یافت نشد.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/dashboard?tab=wishlist"
            aria-label="لیست علاقه‌مندی‌ها"
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-rose-400 transition-colors"
          >
            <Heart className="h-4 w-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white tabular-nums">
                {toPersianDigits(wishlist.length)}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            aria-label="باز کردن سبد خرید"
            className="relative flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2.5 sm:px-3.5 text-slate-200 hover:border-indigo-500/60 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline text-xs font-semibold">سبد خرید</span>
            {cart.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-slate-950 tabular-nums">
                {toPersianDigits(cart.length)}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/dashboard"
                aria-label="داشبورد کاربری"
                className="flex h-9 sm:h-10 items-center gap-2 rounded-xl bg-indigo-600 px-2.5 sm:px-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {user.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="خروج از حساب کاربری"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl bg-indigo-600 px-3 sm:px-4 text-xs font-bold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0"
            >
              <User className="h-4 w-4" />
              <span className="sm:hidden">ورود</span>
              <span className="hidden sm:inline">ورود / ثبت‌نام</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={mobileMenuOpen}
            className="flex lg:hidden h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 lg:hidden space-y-3">
          <div className="relative">
            <input
              type="search"
              aria-label="جستجوی موبایل"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setMobileMenuOpen(false);
                  push(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="جستجوی دوره..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pr-9 pl-4 text-xs text-white"
            />
            <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/courses?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs font-semibold text-slate-200"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 text-sm">
            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-300"
            >
              کاتالوگ تمام دوره‌ها
            </Link>
            <Link
              href="/#roadmaps"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-300"
            >
              نقشه‌های راه
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 font-bold text-emerald-400"
              >
                ورود به پنل مدیریت
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
