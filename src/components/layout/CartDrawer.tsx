import React from "react";
import { Link } from "../../router";
import { useStore } from "../../store/useStore";
import { formatToman, toPersianDigits } from "../../utils/formatters";
import { ArrowLeft, ShoppingBag, Trash2, X } from "lucide-react";

export function CartDrawer() {
  const {
    cart,
    isCartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    getCartTotals,
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const { finalTotal } = getCartTotals();

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="سبد خرید"
    >
      <div
        onClick={() => setCartDrawerOpen(false)}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 flex max-w-full pr-10">
        <div className="w-screen max-w-md border-r border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                سبد خرید شما ({toPersianDigits(cart.length)} دوره)
              </h2>
            </div>
            <button
              type="button"
              aria-label="بستن سبد خرید"
              onClick={() => setCartDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/70 text-slate-500">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-slate-300">
                  سبد خرید شما خالی است
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  دوره‌های مورد نظر خود را برای شروع یادگیری اضافه کنید.
                </p>
                <Link
                  href="/courses"
                  onClick={() => setCartDrawerOpen(false)}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  مشاهده دوره‌های آموزشی
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-16 w-20 rounded-xl object-cover shrink-0 bg-slate-900"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/courses/${item.slug}`}
                        onClick={() => setCartDrawerOpen(false)}
                        className="line-clamp-1 text-xs font-bold text-slate-100 hover:text-indigo-400"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {item.instructorName}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 tabular-nums">
                        <span className="text-xs font-bold text-emerald-400">
                          {formatToman(item.discountPrice ?? item.price)}
                        </span>
                        {item.discountPrice !== null &&
                          item.discountPrice < item.price && (
                            <span className="text-[11px] text-slate-500 line-through">
                              {formatToman(item.price)}
                            </span>
                          )}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`حذف ${item.title} از سبد خرید`}
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-800 bg-slate-950 p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">مبلغ قابل پرداخت:</span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">
                  {formatToman(finalTotal)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                  مشاهده سبد خرید
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setCartDrawerOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  <span>تسویه حساب</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
