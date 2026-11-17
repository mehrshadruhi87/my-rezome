import type { AppliedCoupon } from "../types";

export interface PricedItem {
  price: number;
  discountPrice: number | null;
}

export interface CartTotals {
  subtotal: number;
  courseDiscount: number;
  afterCourseDiscount: number;
  couponDiscount: number;
  finalTotal: number;
}

export function calculateDiscountPercent(
  price: number,
  discountPrice: number | null
): number {
  if (price <= 0 || discountPrice === null || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function calculateCartTotals(
  items: PricedItem[],
  coupon: AppliedCoupon | null
): CartTotals {
  const subtotal = items.reduce((acc, item) => acc + Math.max(0, item.price), 0);
  const afterCourseDiscount = items.reduce((acc, item) => {
    const effective =
      item.discountPrice !== null && item.discountPrice >= 0
        ? Math.min(item.price, item.discountPrice)
        : item.price;
    return acc + Math.max(0, effective);
  }, 0);

  const courseDiscount = Math.max(0, subtotal - afterCourseDiscount);

  let couponDiscount = 0;
  if (coupon && afterCourseDiscount > 0) {
    if (coupon.type === "PERCENTAGE") {
      const pct = Math.min(100, Math.max(0, coupon.value));
      couponDiscount = Math.round((afterCourseDiscount * pct) / 100);
    } else {
      couponDiscount = Math.min(afterCourseDiscount, Math.max(0, coupon.value));
    }
  }

  const finalTotal = Math.max(0, afterCourseDiscount - couponDiscount);

  return {
    subtotal,
    courseDiscount,
    afterCourseDiscount,
    couponDiscount,
    finalTotal,
  };
}

export interface DiscountValidationCandidate {
  code: string;
  isActive: boolean;
  usedCount: number;
  maxUses: number;
  expiresAt: string | null;
}

export function validateDiscountEligibility(
  discount: DiscountValidationCandidate | null | undefined,
  now: Date = new Date()
): { valid: true } | { valid: false; error: string } {
  if (!discount || !discount.isActive) {
    return {
      valid: false,
      error: "کد تخفیف وارد شده معتبر نیست یا غیرفعال شده است.",
    };
  }
  if (discount.usedCount >= discount.maxUses) {
    return {
      valid: false,
      error: "ظرفیت استفاده از این کد تخفیف به پایان رسیده است.",
    };
  }
  if (discount.expiresAt && new Date(discount.expiresAt) < now) {
    return {
      valid: false,
      error: "مهلت استفاده از این کد تخفیف منقضی شده است.",
    };
  }
  return { valid: true };
}
