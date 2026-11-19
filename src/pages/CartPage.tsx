import React, { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { apiRequest } from "../lib/api";
import { formatToman, toPersianDigits } from "../utils/formatters";
import {
  DEFAULT_COURSE_THUMBNAIL,
  resolveCourseThumbnail,
} from "../data/courseAssets";
import type { AppliedCoupon } from "../types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";

type CartTab = "cart" | "wishlist";

export function CartPage() {
  const { settings } = useAuth();
  const {
    cart,
    wishlist,
    coupon,
    addToCart,
    removeFromCart,
    toggleWishlist,
    applyCouponState,
    getCartTotals,
  } = useStore();
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<CartTab>(
    searchParams.get("tab") === "wishlist" ? "wishlist" : "cart"
  );
  const [couponInput, setCouponInput] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "wishlist") setActiveTab("wishlist");
    else if (t === "cart") setActiveTab("cart");
  }, [searchParams]);

  const totals = getCartTotals();

  const handleSwitchTab = (tab: CartTab) => {
    setActiveTab(tab);
    push(tab === "wishlist" ? "/cart?tab=wishlist" : "/cart");
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("لطفاً کد تخفیف را وارد کنید.");
      return;
    }
    setValidating(true);
    try {
      const res = await apiRequest<{ coupon: AppliedCoupon }>(
        "/api/coupons/validate",
        {
          method: "POST",
          body: JSON.stringify({ code }),
        }
      );
      applyCouponState(res.coupon);
      setCouponInput("");
      toast.success(`کد تخفیف ${res.coupon.code} با موفقیت اعمال شد!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "کد تخفیف نامعتبر است.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10 space-y-8">
      {/* Header & Unified Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            سبد خرید و علاقه‌مندی‌ها
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            مدیریت دوره‌های انتخابی، اعمال کد تخفیف و دسترسی سریع به لیست علاقه‌مندی‌ها
          </p>
        </div>

        <div
          role="tablist"
          aria-label="تب‌های سبد خرید و علاقه‌مندی‌ها"
          className="inline-flex rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E2E8F0] dark:bg-slate-900 p-1.5 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cart"}
            onClick={() => handleSwitchTab("cart")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "cart"
                ? "bg-[var(--accent-600)] text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>سبد خرید ({toPersianDigits(cart.length)})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "wishlist"}
            onClick={() => handleSwitchTab("wishlist")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "wishlist"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>علاقه‌مندی‌ها ({toPersianDigits(wishlist.length)})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CART */}
      {activeTab === "cart" && (
        <>
          {cart.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 px-6 py-16 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                سبد خرید شما خالی است
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                می‌توانید از کاتالوگ دوره‌ها یا تب علاقه‌مندی‌ها، دوره مورد نظر خود را اضافه کنید.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/courses"
                  className="btn-3d inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold"
                >
                  <span>مشاهده دوره‌های آموزشی</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                {wishlist.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSwitchTab("wishlist")}
                    className="btn-3d-secondary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold"
                  >
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>
                      مشاهده علاقه‌مندی‌ها ({toPersianDigits(wishlist.length)})
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/75 p-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={resolveCourseThumbnail(item.thumbnail)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                        }}
                        className="h-20 w-28 rounded-xl object-cover shrink-0 bg-slate-950"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/courses/${item.slug}`}
                          className="text-sm font-bold text-slate-900 dark:text-white hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          مدرس: {item.instructorName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left tabular-nums">
                        {item.discountPrice !== null &&
                          item.discountPrice < item.price && (
                            <div className="text-xs text-slate-500 line-through">
                              {formatToman(item.price)}
                            </div>
                          )}
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          {formatToman(item.discountPrice ?? item.price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`حذف ${item.title}`}
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 p-2.5 text-slate-600 dark:text-slate-400 hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-6 space-y-5">
                <h2 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-800 pb-3">
                  خلاصه صورت‌حساب
                </h2>

                {settings.allowCoupons && (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label
                      htmlFor="coupon-code-input"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      کد تخفیف دارید؟ (مثلاً BAHAR30 یا WELCOME500)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="coupon-code-input"
                          type="text"
                          dir="ltr"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="BAHAR30"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:border-[var(--accent-500)] focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={validating}
                        className="rounded-xl bg-slate-800 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--accent-600)] transition-colors shrink-0 disabled:opacity-50"
                      >
                        {validating ? "..." : "اعمال کد"}
                      </button>
                    </div>
                  </form>
                )}

                {settings.allowCoupons && coupon && (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/12 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" />
                      <span className="font-mono font-bold">{coupon.code}</span>
                      <span>
                        (
                        {coupon.type === "PERCENTAGE"
                          ? `${toPersianDigits(coupon.value)}٪`
                          : formatToman(coupon.value)}
                        )
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="حذف کد تخفیف"
                      onClick={() => applyCouponState(null)}
                      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-300 dark:border-slate-800 pt-4 text-xs tabular-nums">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>جمع کل دوره‌ها</span>
                    <span>{formatToman(totals.subtotal)}</span>
                  </div>
                  {totals.courseDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>تخفیف ویژه دوره‌ها</span>
                      <span>− {formatToman(totals.courseDiscount)}</span>
                    </div>
                  )}
                  {totals.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>تخفیف کد ({coupon?.code})</span>
                      <span>− {formatToman(totals.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 dark:border-slate-800 pt-3 text-base font-black text-slate-900 dark:text-white">
                    <span>مبلغ قابل پرداخت</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {formatToman(totals.finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => push("/checkout")}
                  className="btn-3d flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold"
                >
                  <span>ادامه و تسویه حساب</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </aside>
            </div>
          )}
        </>
      )}

      {/* TAB 2: WISHLIST */}
      {activeTab === "wishlist" && (
        <>
          {wishlist.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/70 px-6 py-16 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                لیست علاقه‌مندی‌های شما خالی است
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                روی آیکون قلب روی کارت هر دوره کلیک کنید تا در اینجا ذخیره شود و هر زمان خواستید با یک کلیک به سبد خرید اضافه کنید.
              </p>
              <Link
                href="/courses"
                className="btn-3d inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold"
              >
                <span>کشف دوره‌های آموزشی</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((item) => {
                const inCart = cart.some((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="cyber-glow-card flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900/80"
                  >
                    <Link
                      href={`/courses/${item.slug}`}
                      className="relative aspect-video w-full overflow-hidden bg-slate-950 block"
                    >
                      <img
                        src={resolveCourseThumbnail(item.thumbnail)}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_COURSE_THUMBNAIL;
                        }}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <Link
                          href={`/courses/${item.slug}`}
                          className="text-sm font-black text-slate-900 dark:text-white hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          مدرس: {item.instructorName}
                        </p>
                        <div className="mt-3 flex items-baseline gap-2 tabular-nums">
                          <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                            {formatToman(item.discountPrice ?? item.price)}
                          </span>
                          {item.discountPrice !== null &&
                            item.discountPrice < item.price && (
                              <span className="text-xs text-slate-500 line-through">
                                {formatToman(item.price)}
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-300/80 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            const added = addToCart(item);
                            if (added) {
                              toast.success("دوره به سبد خرید اضافه شد.");
                            } else {
                              toast.info("این دوره در سبد خرید موجود است.");
                            }
                            handleSwitchTab("cart");
                          }}
                          className="btn-3d flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>
                            {inCart ? "مشاهده در سبد خرید" : "افزودن به سبد خرید"}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`حذف ${item.title} از علاقه‌مندی‌ها`}
                          onClick={() => {
                            toggleWishlist(item);
                            toast.info("از علاقه‌مندی‌ها حذف شد.");
                          }}
                          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
