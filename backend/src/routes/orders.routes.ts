import { Router } from "express";
import {
  calculateCartTotals,
  validateDiscountEligibility,
} from "../../../src/utils/pricing";
import { env } from "../config/env";
import { getRepository } from "../db";
import type { CourseEntity } from "../db/repository";
import {
  type AuthenticatedRequest,
  requireAuth,
  requireRoles,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import {
  requestZarinpalPayment,
  verifyZarinpalPayment,
} from "../services/zarinpalService";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors";
import type { OrderStatus } from "../../../src/types";
import {
  checkoutInitiateSchema,
  checkoutVerifySchema,
  couponCreateSchema,
  couponToggleSchema,
  couponValidateSchema,
  orderStatusUpdateSchema,
} from "../validators/schemas";

export const ordersRouter = Router();

// --- COUPONS ---
ordersRouter.post(
  "/coupons/validate",
  validate({ body: couponValidateSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const settings = await repo.getSettings();
    if (!settings.allowCoupons) {
      throw new ForbiddenError(
        "استفاده از کدهای تخفیف در حال حاضر توسط مدیریت غیرفعال شده است."
      );
    }

    const discount = await repo.findCouponByCode(req.body.code);
    const check = validateDiscountEligibility(discount ?? undefined);
    if (!check.valid || !discount) {
      throw new BadRequestError(
        check.valid ? "کد تخفیف نامعتبر است." : check.error
      );
    }

    sendSuccess(res, {
      coupon: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
      },
    });
  })
);

ordersRouter.get(
  "/admin/coupons",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (_req, res) => {
    const repo = getRepository();
    const coupons = await repo.listCoupons();
    sendSuccess(res, { coupons });
  })
);

ordersRouter.post(
  "/admin/coupons",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: couponCreateSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const coupon = await repo.createCoupon({
      code: req.body.code,
      type: req.body.type,
      value: req.body.value,
      maxUses: req.body.maxUses,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
    });
    sendCreated(res, { coupon }, "کد تخفیف با موفقیت ایجاد شد.");
  })
);

ordersRouter.patch(
  "/admin/coupons/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: couponToggleSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const coupon = await repo.updateCouponStatus(
      String(req.params.id),
      req.body.isActive
    );
    sendSuccess(res, { coupon }, "وضعیت کد تخفیف به‌روزرسانی شد.");
  })
);

ordersRouter.delete(
  "/admin/coupons/:id",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    await repo.deleteCoupon(String(req.params.id));
    sendSuccess(res, { ok: true }, "کد تخفیف حذف شد.");
  })
);

// --- CHECKOUT & ZARINPAL PAYMENT FLOW ---
ordersRouter.post(
  "/checkout/initiate",
  requireAuth,
  validate({ body: checkoutInitiateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const user = req.authUser!;
    const { courseIds, couponCode } = req.body as {
      courseIds: string[];
      couponCode?: string | null;
    };

    const uniqueIds = [...new Set(courseIds)];
    const selectedCourses: CourseEntity[] = [];
    for (const id of uniqueIds) {
      const course = await repo.findCourseById(id);
      if (course && course.isPublished) {
        selectedCourses.push(course);
      }
    }

    if (selectedCourses.length === 0) {
      throw new NotFoundError("دوره‌های انتخاب شده یافت نشدند.");
    }

    // Prevent duplicate enrollment / purchase
    const alreadyEnrolledIds = new Set(await repo.getEnrolledCourseIds(user.id));
    const duplicates = selectedCourses.filter((c) => alreadyEnrolledIds.has(c.id));
    if (duplicates.length > 0) {
      throw new ConflictError(
        `شما قبلاً در دوره «${duplicates[0].title}» ثبت‌نام کرده‌اید. لطفاً آن را از سبد خرید حذف کنید.`
      );
    }

    // Server-side coupon validation
    let appliedCoupon: {
      id: string;
      code: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
    } | null = null;

    if (couponCode) {
      const settings = await repo.getSettings();
      if (!settings.allowCoupons) {
        throw new ForbiddenError("استفاده از کد تخفیف غیرفعال است.");
      }
      const candidate = await repo.findCouponByCode(couponCode);
      const check = validateDiscountEligibility(candidate ?? undefined);
      if (!check.valid || !candidate) {
        throw new BadRequestError(
          check.valid ? "کد تخفیف نامعتبر است." : check.error
        );
      }
      appliedCoupon = {
        id: candidate.id,
        code: candidate.code,
        type: candidate.type,
        value: candidate.value,
      };
    }

    // Recalculate totals strictly on server
    const totals = calculateCartTotals(
      selectedCourses.map((c) => ({
        price: c.price,
        discountPrice: c.discountPrice,
      })),
      appliedCoupon
    );

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const order = await repo.createPendingOrder({
      orderNumber,
      userId: user.id,
      totalAmount: totals.subtotal,
      discountAmount: Math.max(0, totals.subtotal - totals.finalTotal),
      finalAmount: totals.finalTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountCodeId: appliedCoupon ? appliedCoupon.id : null,
      items: selectedCourses.map((c) => ({
        courseId: c.id,
        price: c.discountPrice !== null ? c.discountPrice : c.price,
      })),
    });

    if (order.finalAmount === 0) {
      sendCreated(
        res,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          finalAmount: 0,
          requiresGateway: false,
        },
        "سفارش رایگان ایجاد شد."
      );
      return;
    }

    const requestOrigin =
      req.headers.origin ||
      `${req.protocol}://${req.get("host")}` ||
      env.appUrl;
    const callbackUrl = env.isProduction
      ? env.zarinpalCallbackUrl
      : `${requestOrigin}/api/payments/zarinpal/callback`;

    const gateway = await requestZarinpalPayment({
      amountToman: order.finalAmount,
      description: `خرید ${selectedCourses.length} دوره آموزشی - سفارش ${order.orderNumber}`,
      orderNumber: order.orderNumber,
      email: user.email,
      mobile: user.phone || undefined,
      callbackUrl,
    });

    await repo.createPaymentTransaction({
      orderId: order.id,
      gateway: "ZARINPAL",
      authority: gateway.authority,
      amount: order.finalAmount,
      status: "INITIATED",
      rawResponse: {
        sandbox: env.zarinpalSandbox,
        paymentUrl: gateway.paymentUrl,
      },
    });

    sendCreated(
      res,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        finalAmount: order.finalAmount,
        requiresGateway: true,
        authority: gateway.authority,
        paymentUrl: gateway.paymentUrl,
        sandboxSimulated: Boolean(gateway.sandboxSimulated),
      },
      "سفارش ثبت شد. در حال انتقال به درگاه پرداخت..."
    );
  })
);

// Real Zarinpal Browser Redirect Callback (Server-to-Server Verify)
ordersRouter.get(
  "/payments/zarinpal/callback",
  asyncHandler(async (req, res) => {
    const authority = String(req.query.Authority || "").trim();
    const status = String(req.query.Status || "").trim();
    const frontendBase = env.isProduction
      ? env.frontendUrl.replace(/\/+$/, "")
      : `${req.protocol}://${req.get("host")}`;

    if (!authority) {
      res.redirect(`${frontendBase}/checkout?payment=failed&reason=missing_authority`);
      return;
    }

    const repo = getRepository();
    const record = await repo.findOrderByAuthority(authority);
    if (!record) {
      res.redirect(`${frontendBase}/checkout?payment=failed&reason=order_not_found`);
      return;
    }

    const { order } = record;
    if (order.status === "COMPLETED") {
      res.redirect(
        `${frontendBase}/checkout?payment=success&orderNumber=${encodeURIComponent(
          order.orderNumber
        )}&ref=${encodeURIComponent(order.paymentRef || "")}&amount=${order.finalAmount}`
      );
      return;
    }

    if (status !== "OK") {
      await repo.failOrderPayment({
        orderId: order.id,
        authority,
        rawResponse: { callbackStatus: status },
      });
      res.redirect(
        `${frontendBase}/checkout?payment=failed&orderNumber=${encodeURIComponent(
          order.orderNumber
        )}`
      );
      return;
    }

    const verified = await verifyZarinpalPayment({
      authority,
      amountToman: order.finalAmount,
    });

    if (!verified.verified || !verified.refId) {
      await repo.failOrderPayment({
        orderId: order.id,
        authority,
        rawResponse: verified.raw,
      });
      res.redirect(
        `${frontendBase}/checkout?payment=failed&orderNumber=${encodeURIComponent(
          order.orderNumber
        )}`
      );
      return;
    }

    const completed = await repo.completeOrderPayment({
      orderId: order.id,
      paymentRef: verified.refId,
      authority,
      rawResponse: verified.raw,
    });

    await repo.createNotification({
      userId: order.userId,
      title: "پرداخت موفق و فعال‌سازی دوره‌ها",
      message: `سفارش ${completed.order.orderNumber} با کد رهگیری ${verified.refId} تایید شد.`,
      type: "ORDER",
      link: "/dashboard?tab=enrolled",
    });

    res.redirect(
      `${frontendBase}/checkout?payment=success&orderNumber=${encodeURIComponent(
        completed.order.orderNumber
      )}&ref=${encodeURIComponent(verified.refId)}&amount=${completed.order.finalAmount}`
    );
  })
);

// Server-to-server verification API (Free orders or Sandbox/API verification)
ordersRouter.post(
  "/checkout/verify",
  requireAuth,
  validate({ body: checkoutVerifySchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const user = req.authUser!;
    const { orderId, authority, status } = req.body;

    const order = await repo.findOrderById(orderId);
    if (!order || (order.userId !== user.id && user.role !== "ADMIN")) {
      throw new NotFoundError("سفارش یافت نشد.");
    }

    if (order.status === "COMPLETED") {
      sendSuccess(res, {
        success: true,
        orderNumber: order.orderNumber,
        paymentRef: order.paymentRef,
        enrolledCourseIds: order.items.map((i) => i.courseId),
      });
      return;
    }

    if (status === "FAILED" || status === "NOK") {
      await repo.failOrderPayment({ orderId: order.id, authority });
      sendSuccess(res, {
        success: false,
        orderNumber: order.orderNumber,
      });
      return;
    }

    // Free order verification (0 Toman verified directly from DB)
    if (order.finalAmount === 0) {
      const freeRef = `FREE-${order.orderNumber}`;
      const completed = await repo.completeOrderPayment({
        orderId: order.id,
        paymentRef: freeRef,
      });
      await repo.createNotification({
        userId: order.userId,
        title: "ثبت‌نام رایگان انجام شد",
        message: `سفارش ${completed.order.orderNumber} با موفقیت تایید و دوره‌ها فعال شدند.`,
        type: "ORDER",
        link: "/dashboard?tab=enrolled",
      });
      sendSuccess(res, {
        success: true,
        orderNumber: completed.order.orderNumber,
        paymentRef: freeRef,
        enrolledCourseIds: completed.enrolledCourseIds,
      });
      return;
    }

    // Paid order MUST be verified server-to-server with Zarinpal Authority
    if (!authority) {
      throw new BadRequestError(
        "کد Authority درگاه پرداخت برای استعلام تراکنش الزامی است."
      );
    }

    const txRecord = await repo.findOrderByAuthority(authority);
    if (!txRecord || txRecord.order.id !== order.id) {
      throw new BadRequestError("تراکنش مطابق با این سفارش یافت نشد.");
    }

    const verified = await verifyZarinpalPayment({
      authority,
      amountToman: order.finalAmount,
    });

    if (!verified.verified || !verified.refId) {
      await repo.failOrderPayment({
        orderId: order.id,
        authority,
        rawResponse: verified.raw,
      });
      sendSuccess(res, {
        success: false,
        orderNumber: order.orderNumber,
      });
      return;
    }

    const completed = await repo.completeOrderPayment({
      orderId: order.id,
      paymentRef: verified.refId,
      authority,
      rawResponse: verified.raw,
    });

    await repo.createNotification({
      userId: order.userId,
      title: "پرداخت موفق و فعال‌سازی دوره‌ها",
      message: `سفارش ${completed.order.orderNumber} با کد رهگیری ${verified.refId} تایید شد.`,
      type: "ORDER",
      link: "/dashboard?tab=enrolled",
    });

    sendSuccess(res, {
      success: true,
      orderNumber: completed.order.orderNumber,
      paymentRef: verified.refId,
      enrolledCourseIds: completed.enrolledCourseIds,
    });
  })
);

// --- USER & ADMIN ORDERS ---
ordersRouter.get(
  "/orders/my",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const orders = await repo.listUserOrders(req.authUser!.id);
    sendSuccess(res, { orders });
  })
);

ordersRouter.get(
  "/admin/orders",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const q = String(req.query.q || "").trim() || undefined;
    const statusRaw = String(req.query.status || "").trim();
    const status = [
      "PENDING",
      "COMPLETED",
      "FAILED",
      "REFUNDED",
      "CANCELLED",
    ].includes(statusRaw)
      ? (statusRaw as OrderStatus)
      : undefined;

    const result = await repo.listAdminOrders({ status, q, page, limit });
    sendSuccess(res, { orders: result.orders }, "لیست سفارش‌ها دریافت شد.", 200, {
      page,
      limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / limit)),
    });
  })
);

ordersRouter.patch(
  "/admin/orders/:id/status",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: orderStatusUpdateSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const order = await repo.updateOrderStatus(
      String(req.params.id),
      req.body.status
    );
    sendSuccess(res, { order }, "وضعیت سفارش به‌روزرسانی شد.");
  })
);
