import { Router } from "express";
import { getRepository } from "../db";
import type { ReviewStatus } from "../db/repository";
import {
  type AuthenticatedRequest,
  requireAuth,
  requireRoles,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import {
  reviewCreateSchema,
  reviewModerateSchema,
} from "../validators/schemas";

export const reviewsRouter = Router();

reviewsRouter.get(
  "/courses/:id/reviews",
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const reviews = await repo.listCourseReviews(String(req.params.id), false);
    sendSuccess(res, { reviews });
  })
);

reviewsRouter.post(
  "/courses/:id/reviews",
  requireAuth,
  validate({ body: reviewCreateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const settings = await repo.getSettings();
    if (!settings.allowReviews) {
      throw new ForbiddenError(
        "ثبت دیدگاه جدید در حال حاضر توسط مدیریت غیرفعال شده است."
      );
    }

    const course = await repo.findCourseById(String(req.params.id));
    if (!course) throw new NotFoundError("دوره یافت نشد.");

    const result = await repo.createReview({
      courseId: course.id,
      userId: req.authUser!.id,
      rating: req.body.rating,
      comment: req.body.comment,
      status: "APPROVED",
    });

    sendCreated(
      res,
      { review: result.review, rating: result.courseRating },
      "دیدگاه شما با موفقیت ثبت شد."
    );
  })
);

reviewsRouter.put(
  "/reviews/:id",
  requireAuth,
  validate({ body: reviewCreateSchema.partial() }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const existing = await repo.findReviewById(String(req.params.id));
    if (!existing) throw new NotFoundError("دیدگاه یافت نشد.");
    if (existing.userId !== req.authUser!.id && req.authUser!.role !== "ADMIN") {
      throw new ForbiddenError("شما فقط مجاز به ویرایش دیدگاه خود هستید.");
    }

    const updated = await repo.updateReview(existing.id, {
      rating: req.body.rating,
      comment: req.body.comment,
    });
    sendSuccess(
      res,
      { review: updated.review, rating: updated.courseRating },
      "دیدگاه با موفقیت ویرایش شد."
    );
  })
);

reviewsRouter.delete(
  "/reviews/:id",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const existing = await repo.findReviewById(String(req.params.id));
    if (!existing) throw new NotFoundError("دیدگاه یافت نشد.");
    if (existing.userId !== req.authUser!.id && req.authUser!.role !== "ADMIN") {
      throw new ForbiddenError("شما مجاز به حذف این دیدگاه نیستید.");
    }
    const result = await repo.deleteReview(existing.id);
    sendSuccess(
      res,
      { ok: true, rating: result.courseRating },
      "دیدگاه حذف شد."
    );
  })
);

reviewsRouter.get(
  "/admin/reviews",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const statusRaw = String(req.query.status || "").trim();
    const status = ["PENDING", "APPROVED", "REJECTED"].includes(statusRaw)
      ? (statusRaw as ReviewStatus)
      : undefined;

    const result = await repo.listAdminReviews({ status, page, limit });
    sendSuccess(
      res,
      { reviews: result.reviews },
      "لیست دیدگاه‌ها دریافت شد.",
      200,
      {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      }
    );
  })
);

reviewsRouter.patch(
  "/admin/reviews/:id/moderate",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: reviewModerateSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const result = await repo.moderateReview(
      String(req.params.id),
      req.body.status
    );
    sendSuccess(
      res,
      { review: result.review, rating: result.courseRating },
      "وضعیت دیدگاه به‌روزرسانی شد."
    );
  })
);
