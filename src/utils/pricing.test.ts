import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCartTotals,
  calculateDiscountPercent,
  validateDiscountEligibility,
} from "./pricing";

test("calculateDiscountPercent computes rounded integer percentages", () => {
  assert.equal(calculateDiscountPercent(4800000, 3450000), 28);
  assert.equal(calculateDiscountPercent(0, 0), 0);
  assert.equal(calculateDiscountPercent(100000, null), 0);
  assert.equal(calculateDiscountPercent(100000, 120000), 0);
});

test("calculateCartTotals computes percentage and fixed coupons accurately", () => {
  const items = [
    { price: 4800000, discountPrice: 3450000 },
    { price: 2000000, discountPrice: null },
  ];

  const noCoupon = calculateCartTotals(items, null);
  assert.equal(noCoupon.subtotal, 6800000);
  assert.equal(noCoupon.courseDiscount, 1350000);
  assert.equal(noCoupon.afterCourseDiscount, 5450000);
  assert.equal(noCoupon.couponDiscount, 0);
  assert.equal(noCoupon.finalTotal, 5450000);

  const pctCoupon = calculateCartTotals(items, {
    code: "BAHAR30",
    type: "PERCENTAGE",
    value: 30,
  });
  assert.equal(pctCoupon.couponDiscount, 1635000);
  assert.equal(pctCoupon.finalTotal, 3815000);

  const fixedCoupon = calculateCartTotals(
    [{ price: 300000, discountPrice: 200000 }],
    { code: "WELCOME500", type: "FIXED", value: 500000 }
  );
  assert.equal(fixedCoupon.couponDiscount, 200000);
  assert.equal(fixedCoupon.finalTotal, 0);
});

test("validateDiscountEligibility rejects inactive, exhausted, and expired codes", () => {
  const now = new Date("2026-11-18T00:00:00Z");

  assert.equal(validateDiscountEligibility(null, now).valid, false);
  assert.equal(
    validateDiscountEligibility(
      { code: "OFF", isActive: false, usedCount: 0, maxUses: 10, expiresAt: null },
      now
    ).valid,
    false
  );
  assert.equal(
    validateDiscountEligibility(
      { code: "MAX", isActive: true, usedCount: 10, maxUses: 10, expiresAt: null },
      now
    ).valid,
    false
  );
  assert.equal(
    validateDiscountEligibility(
      {
        code: "EXP",
        isActive: true,
        usedCount: 0,
        maxUses: 10,
        expiresAt: "2026-11-17T00:00:00Z",
      },
      now
    ).valid,
    false
  );
  assert.equal(
    validateDiscountEligibility(
      {
        code: "BAHAR30",
        isActive: true,
        usedCount: 5,
        maxUses: 200,
        expiresAt: "2027-01-01T00:00:00Z",
      },
      now
    ).valid,
    true
  );
});
