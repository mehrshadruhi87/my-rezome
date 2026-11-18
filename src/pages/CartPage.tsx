import React, { useState } from "react";
import { Link, useRouter } from "../router";
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
import { ArrowLeft, ShoppingBag, Tag, Trash2, X } from "lucide-react";

export function CartPage() {
  const { settings } = useAuth();
  const {
    cart,
    coupon,
    removeFromCart,
    applyCouponState,
    getCartTotals,
  } = useStore();
  const { push } = useRouter();
  const [couponInput, setCouponInput] = useState("");
  const [validating, setValidating] = useState(false);

  const totals = getCartTotals();

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

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-black text-white">سبد خرید شما خالی است</h1>
        <p className="mt-2 text-xs text-slate-400">
          می‌توانید از کاتالوگ دوره‌ها، بوت‌کمپ مورد علاقه خود را انتخاب کنید.
        </p>
        <Link
          href="/courses"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-500"
        >
          مشاهده دوره‌های آموزشی
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-black text-white">
        سبد خرید ({toPersianDigits(cart.length)} دوره)
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
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
                    className="text-sm font-bold text-white hover:text-indigo-400 line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
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
                  <div className="text-sm font-black text-emerald-400">
                    {formatToman(item.discountPrice ?? item.price)}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`حذف ${item.title}`}
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:border-rose-500/40 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            خلاصه صورت‌حساب
          </h2>

          {settings.allowCoupons && (
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label
                htmlFor="coupon-code-input"
                className="block text-xs font-semibold text-slate-300"
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={validating}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors shrink-0 disabled:opacity-50"
                >
                  {validating ? "..." : "اعمال کد"}
                </button>
              </div>
            </form>
          )}

          {settings.allowCoupons && coupon && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
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
                className="text-slate-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-3 border-t border-slate-800 pt-4 text-xs tabular-nums">
            <div className="flex justify-between text-slate-400">
              <span>جمع کل دوره‌ها</span>
              <span>{formatToman(totals.subtotal)}</span>
            </div>
            {totals.courseDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>تخفیف ویژه دوره‌ها</span>
                <span>− {formatToman(totals.courseDiscount)}</span>
              </div>
            )}
            {totals.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>تخفیف کد ({coupon?.code})</span>
                <span>− {formatToman(totals.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800 pt-3 text-base font-black text-white">
              <span>مبلغ قابل پرداخت</span>
              <span className="text-emerald-400">
                {formatToman(totals.finalTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => push("/checkout")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            <span>ادامه و تسویه حساب</span>
            <ArrowLeft className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
