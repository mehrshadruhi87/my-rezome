import React, { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../../router";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../store/useStore";
import { apiRequest } from "../../lib/api";
import {
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../../data/courseAssets";
import { formatToman, toPersianDigits } from "../../utils/formatters";
import type { CourseSummary } from "../../types";
import { SettingsDrawer } from "./SettingsDrawer";
import {
  ChevronDown,
  Code2,
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
  const { user, categories, settings, logout } = useAuth();
  const { cart } = useStore();
  const { push } = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<CourseSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        if (!searchQuery.trim()) {
          setSearchExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

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

  const isExpanded = searchExpanded || searchQuery.trim().length > 0;

  return (
    <>
      <header
        data-testid="site-header"
        data-scrolled={isScrolled ? "true" : "false"}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "border-b border-slate-200/70 dark:border-white/10 bg-white/65 dark:bg-slate-950/60 backdrop-blur-xl shadow-[0_8px_30px_-14px_rgba(15,23,42,0.16)] dark:shadow-[0_12px_36px_-14px_rgba(0,0,0,0.65)]"
            : "border-b border-slate-300/45 dark:border-white/[0.04] bg-[var(--site-bg)]"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 sm:gap-4 px-4 py-3 sm:px-6 lg:px-10">
          {/* Zone 1 & 2: Hamburger Drawer Trigger + Brand + Concise Nav */}
          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-label={
                drawerOpen
                  ? "بستن منو و مینی تنظیمات"
                  : "باز کردن منو و مینی تنظیمات"
              }
              aria-expanded={drawerOpen}
              data-testid="hamburger-settings-trigger"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-[var(--accent-500)]/60 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] transition-colors shrink-0"
            >
              {drawerOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] text-white shadow-md shadow-[var(--accent-500)]/30">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {settings.brandPrimaryText}
                <span className="text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                  {settings.brandAccentText}
                </span>
              </span>
            </Link>

            <nav
              aria-label="منوی اصلی"
              className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-700 dark:text-slate-300"
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
                  className="flex items-center gap-1 py-2 whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <span>دوره‌ها</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform ${
                      megaMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {megaMenuOpen && (
                  <div className="absolute right-0 top-full w-[580px] pt-1.5 z-50">
                    <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 p-5 shadow-2xl">
                      <div className="mb-3 flex items-center justify-between border-b border-slate-300/80 dark:border-slate-800 pb-2.5">
                        <span className="text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                          دپارتمان‌های تخصصی
                        </span>
                        <Link
                          href="/courses"
                          onClick={() => setMegaMenuOpen(false)}
                          className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
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
                            className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition-colors"
                          >
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-500)]/15 text-[var(--accent-600)] dark:text-[var(--accent-400)]">
                              <Layout className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                                {cat.name}
                              </div>
                              <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
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
                href="/roadmaps"
                className="whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-8 transition-colors"
              >
                نقشه‌های راه
              </Link>
              <Link
                href="/code-lab"
                className="whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-8 transition-colors"
              >
                آزمایشگاه کد
              </Link>
              <Link
                href="/challenges"
                className="whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-8 transition-colors"
              >
                چالش روزانه
              </Link>
              <Link
                href="/news"
                className="whitespace-nowrap shrink-0 hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-8 transition-colors"
              >
                اخبار
              </Link>
              {(user?.role === "ADMIN" || user?.role === "INSTRUCTOR") && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 font-bold transition-colors"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>{user.role === "ADMIN" ? "مدیریت" : "پنل مدرس"}</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Expandable Live Autocomplete Search Bar */}
          <div
            ref={searchRef}
            data-testid="header-search-wrapper"
            className={`relative hidden md:block transition-[width] duration-300 ease-out ${
              isExpanded
                ? "w-72 lg:w-[400px]"
                : "w-44 lg:w-56"
            }`}
          >
            <div className="relative">
              <input
                type="search"
                aria-label="جستجوی دوره"
                data-testid="header-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setSearchExpanded(true);
                  if (searchQuery.trim().length >= 2) {
                    setShowDropdown(true);
                  }
                }}
                onBlur={() => {
                  if (!searchQuery.trim()) {
                    setSearchExpanded(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    setShowDropdown(false);
                    push(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="جستجوی دوره، تکنولوژی یا مدرس..."
                className={`w-full rounded-xl border py-2 pr-9 pl-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-300 ${
                  isExpanded
                    ? "border-[var(--accent-500)] bg-[#F8FAFC] dark:bg-slate-900 shadow-lg shadow-[var(--accent-500)]/15"
                    : "border-slate-300 dark:border-slate-800 bg-slate-200/75 dark:bg-slate-900/90"
                }`}
              />
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>

            {showDropdown && (
              <div className="absolute right-0 left-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 shadow-2xl z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-400">
                    در حال جستجو...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-slate-300/70 dark:divide-slate-800/70">
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        href={`/courses/${item.slug}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-200/80 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <img
                          src={resolveCourseThumbnail(item.thumbnail)}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                          }}
                          className="h-11 w-16 rounded-lg object-cover shrink-0 bg-slate-950"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {item.instructorName} · {item.category.name}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                          {formatToman(item.discountPrice ?? item.price)}
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/courses?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setShowDropdown(false)}
                      className="block bg-slate-200/80 dark:bg-slate-950/70 py-2.5 text-center text-xs font-semibold text-[var(--accent-600)] dark:text-[var(--accent-400)] hover:underline"
                    >
                      مشاهده همه نتایج برای «{searchQuery.trim()}»
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-400">
                    دوره‌ای با این عبارت یافت نشد.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 3: Actions (Direct navigation to dedicated /cart page) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cart"
              data-testid="header-cart-link"
              aria-label="مشاهده سبد خرید و علاقه‌مندی‌ها"
              className="btn-3d-secondary relative flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 px-3 sm:px-3.5 text-slate-800 dark:text-slate-200 hover:border-[var(--accent-500)]/60 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4 text-[var(--accent-600)] dark:text-[var(--accent-400)]" />
              <span className="hidden sm:inline text-xs font-semibold">
                سبد خرید
              </span>
              {cart.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-slate-950 tabular-nums">
                  {toPersianDigits(cart.length)}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  aria-label="داشبورد کاربری"
                  className="btn-3d flex h-9 sm:h-10 items-center gap-2 rounded-xl px-3 sm:px-3.5 text-xs font-bold text-white whitespace-nowrap shrink-0"
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
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="btn-3d flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 text-xs font-bold text-white whitespace-nowrap shrink-0"
              >
                <User className="h-4 w-4" />
                <span className="sm:hidden">ورود</span>
                <span className="hidden sm:inline">ورود / ثبت‌نام</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
    </>
  );
}
