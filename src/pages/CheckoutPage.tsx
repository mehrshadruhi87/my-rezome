import React, { useEffect, useState } from "react";
import { Link, useRouter, useSearchParams } from "../router";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../store/useStore";
import { apiRequest } from "../lib/api";
import { formatToman, toPersianDigits } from "../utils/formatters";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type CheckoutStage = "REVIEW" | "GATEWAY" | "RECEIPT" | "FAILED";

export function CheckoutPage() {
  const { user, refreshBootstrap } = useAuth();
  const { cart, coupon, clearCart, getCartTotals } = useStore();
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<CheckoutStage>("REVIEW");
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    orderNumber: string;
    finalAmount: number;
    authority?: string;
    paymentUrl?: string;
  } | null>(null);
  const [receipt, setReceipt] = useState<{
    orderNumber: string;
    paymentRef: string;
    finalAmount: number;
  } | null>(null);

  const [cardNumber, setCardNumber] = useState("6037-9975-9012-4481");
  const [cvv2, setCvv2] = useState("412");
  const [expMonth, setExpMonth] = useState("08");
  const [expYear, setExpYear] = useState("07");

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      const orderNumber = searchParams.get("orderNumber") || "";
      const ref = searchParams.get("ref") || "";
      const amount = Number(searchParams.get("amount") || 0);
      clearCart();
      refreshBootstrap();
      setReceipt({
        orderNumber,
        paymentRef: ref,
        finalAmount: amount,
      });
      setStage("RECEIPT");
    } else if (paymentStatus === "failed") {
      setStage("FAILED");
    }
  }, [searchParams]);

  const totals = getCartTotals();

  if (!user && stage === "REVIEW") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-8 space-y-4">
          <Lock className="mx-auto h-10 w-10 text-[var(--accent-600)] dark:text-indigo-400" />
          <h1 className="text-lg font-black text-slate-900 dark:text-white">
            برای تکمیل خرید وارد حساب کاربری شوید
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            پس از ورود، سبد خرید شما حفظ شده و بلافاصله به درگاه پرداخت هدایت می‌شوید.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login?redirect=/checkout"
              className="btn-3d inline-block rounded-xl px-6 py-3 text-xs font-bold"
            >
              ورود یا ثبت‌نام سریع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "RECEIPT" && receipt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-2xl border border-emerald-500/35 bg-[#E9EFF6] dark:bg-slate-900 p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            پرداخت موفق و فعال‌سازی دوره‌ها
          </h1>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            تراکنش شما با موفقیت تایید شد و تمامی دوره‌های سفارش در پنل کاربری شما فعال شدند.
          </p>

          <dl className="divide-y divide-slate-300 dark:divide-slate-800 rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/70 px-4 text-xs tabular-nums">
            <div className="flex justify-between py-3">
              <dt className="text-slate-600 dark:text-slate-400">شماره سفارش</dt>
              <dd className="font-mono font-bold text-slate-900 dark:text-white">
                {receipt.orderNumber}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-600 dark:text-slate-400">کد رهگیری شاپرک</dt>
              <dd className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {receipt.paymentRef}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-600 dark:text-slate-400">مبلغ پرداخت‌شده</dt>
              <dd className="font-bold text-slate-900 dark:text-white">
                {formatToman(receipt.finalAmount)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard"
              className="btn-3d flex-1 rounded-xl py-3 text-xs font-bold"
            >
              ورود به دوره‌های من
            </Link>
            <Link
              href="/courses"
              className="btn-3d-secondary flex-1 rounded-xl py-3 text-xs font-bold"
            >
              بازگشت به کاتالوگ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "FAILED") {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-2xl border border-rose-500/35 bg-[#E9EFF6] dark:bg-slate-900 p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
            <XCircle className="h-9 w-9" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            پرداخت ناموفق بود
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            تراکنش توسط کاربر لغو شد یا با خطا مواجه گردید. سبد خرید شما همچنان محفوظ است.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStage("REVIEW")}
              className="btn-3d flex-1 rounded-xl py-3 text-xs font-bold"
            >
              تلاش مجدد
            </button>
            <Link
              href="/cart"
              className="btn-3d-secondary flex-1 rounded-xl py-3 text-xs font-bold"
            >
              بازگشت به سبد خرید
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && stage === "REVIEW") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          سبد خرید شما خالی است
        </h1>
        <Link
          href="/courses"
          className="btn-3d mt-4 inline-block rounded-xl px-5 py-2.5 text-xs font-bold"
        >
          مشاهده دوره‌ها
        </Link>
      </div>
    );
  }

  const handleInitiateCheckout = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        orderId: string;
        orderNumber: string;
        finalAmount: number;
        requiresGateway?: boolean;
        authority?: string;
        paymentUrl?: string;
        sandboxSimulated?: boolean;
      }>("/api/checkout/initiate", {
        method: "POST",
        body: JSON.stringify({
          courseIds: cart.map((c) => c.id),
          couponCode: coupon?.code ?? null,
        }),
      });
      setPendingOrder(res);
      if (res.finalAmount === 0) {
        const verified = await apiRequest<{
          success: boolean;
          orderNumber: string;
          paymentRef: string;
        }>("/api/checkout/verify", {
          method: "POST",
          body: JSON.stringify({ orderId: res.orderId, status: "SUCCESS" }),
        });
        clearCart();
        await refreshBootstrap();
        setReceipt({
          orderNumber: verified.orderNumber,
          paymentRef: verified.paymentRef,
          finalAmount: 0,
        });
        setStage("RECEIPT");
      } else if (res.paymentUrl && !res.sandboxSimulated) {
        window.location.href = res.paymentUrl;
      } else {
        setStage("GATEWAY");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ایجاد سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGatewayResult = async (status: "SUCCESS" | "FAILED") => {
    if (!pendingOrder) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        orderNumber: string;
        paymentRef?: string;
      }>("/api/checkout/verify", {
        method: "POST",
        body: JSON.stringify({
          orderId: pendingOrder.orderId,
          authority: pendingOrder.authority,
          status,
        }),
      });
      if (res.success && res.paymentRef) {
        clearCart();
        await refreshBootstrap();
        setReceipt({
          orderNumber: res.orderNumber,
          paymentRef: res.paymentRef,
          finalAmount: pendingOrder.finalAmount,
        });
        setStage("RECEIPT");
        toast.success("پرداخت با موفقیت انجام شد!");
      } else {
        setStage("FAILED");
        toast.error("تراکنش ناموفق بود.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در تایید تراکنش");
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "GATEWAY" && pendingOrder) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-[#E9EFF6] dark:bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 bg-[#DFE7F2] dark:bg-slate-950 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-black text-slate-900 dark:text-white">
                درگاه پرداخت اینترنتی شاپرک (شبیه‌سازی زرین‌پال)
              </span>
            </div>
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {pendingOrder.orderNumber}
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950/70 p-4 text-xs">
              <div>
                <div className="text-slate-600 dark:text-slate-400">پذیرنده</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-white">
                  موسسه آموزشی کدآکادمی
                </div>
              </div>
              <div className="text-left tabular-nums">
                <div className="text-slate-600 dark:text-slate-400">
                  مبلغ قابل پرداخت
                </div>
                <div className="mt-0.5 text-base font-black text-emerald-700 dark:text-emerald-400">
                  {formatToman(pendingOrder.finalAmount)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="card-num"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  شماره کارت بانکی (تستی)
                </label>
                <div className="relative">
                  <input
                    id="card-num"
                    type="text"
                    dir="ltr"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:border-[var(--accent-500)] focus:outline-none"
                  />
                  <CreditCard className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="card-cvv"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    CVV2
                  </label>
                  <input
                    id="card-cvv"
                    type="text"
                    dir="ltr"
                    value={cvv2}
                    onChange={(e) => setCvv2(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label
                    htmlFor="card-month"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    ماه
                  </label>
                  <input
                    id="card-month"
                    type="text"
                    dir="ltr"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label
                    htmlFor="card-year"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    سال
                  </label>
                  <input
                    id="card-year"
                    type="text"
                    dir="ltr"
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleGatewayResult("SUCCESS")}
                className="rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {submitting ? "در حال تایید..." : "پرداخت موفق"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleGatewayResult("FAILED")}
                className="rounded-xl border border-rose-500/40 bg-rose-500/10 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
              >
                انصراف / پرداخت ناموفق
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-black text-slate-900 dark:text-white">
        تایید نهایی و پرداخت
      </h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-5 items-start">
        <div className="md:col-span-3 space-y-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-6">
          <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-800 pb-3">
            مشخصات خریدار و دوره‌ها
          </h2>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div>نام و نام خانوادگی: {user?.name || "کاربر"}</div>
            <div className="text-slate-600 dark:text-slate-400">
              شناسه دسترسی: {user?.email || user?.phone || user?.username || ""}
            </div>
          </div>

          <div className="divide-y divide-slate-300/80 dark:divide-slate-800/80 pt-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pl-4">
                  {item.title}
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                  {formatToman(item.discountPrice ?? item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="md:col-span-2 rounded-2xl border border-slate-300 dark:border-slate-800 bg-[#E9EFF6] dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-800 pb-3">
            جزئیات پرداخت
          </h2>
          <div className="space-y-2.5 text-xs tabular-nums">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>تعداد دوره‌ها</span>
              <span>{toPersianDigits(cart.length)} دوره</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>مبلغ اصلی</span>
              <span>{formatToman(totals.subtotal)}</span>
            </div>
            {totals.courseDiscount + totals.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>مجموع تخفیف</span>
                <span>
                  − {formatToman(totals.courseDiscount + totals.couponDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-300 dark:border-slate-800 pt-3 text-base font-black text-slate-900 dark:text-white">
              <span>قابل پرداخت</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                {formatToman(totals.finalTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleInitiateCheckout}
            className="btn-3d w-full rounded-xl py-3.5 text-xs font-bold disabled:opacity-50"
          >
            {submitting ? "در حال انتقال..." : "انتقال به درگاه پرداخت"}
          </button>

          <button
            type="button"
            onClick={() => push("/cart")}
            className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            بازگشت به سبد خرید
          </button>
        </aside>
      </div>
    </div>
  );
}
