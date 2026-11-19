import { Router } from "express";
import { getRepository } from "../db";
import {
  type AuthenticatedRequest,
  requireAuth,
  requireRoles,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { manualEnrollmentSchema } from "../validators/schemas";

export const enrollmentsRouter = Router();

enrollmentsRouter.get(
  "/student/dashboard",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const user = req.authUser!;
    const [enrolledCourses, orders] = await Promise.all([
      repo.getStudentEnrolledCourses(user.id),
      repo.listUserOrders(user.id),
    ]);

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      enrolledCourses,
      orders,
    });
  })
);

enrollmentsRouter.post(
  "/enrollments/free",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const courseId = String(req.body?.courseId || "").trim();
    if (!courseId) throw new BadRequestError("شناسه دوره الزامی است.");

    const repo = getRepository();
    const course = await repo.findCourseById(courseId);
    if (!course || !course.isPublished) {
      throw new NotFoundError("دوره مورد نظر یافت نشد.");
    }

    const effectivePrice = course.discountPrice ?? course.price;
    if (effectivePrice > 0) {
      throw new BadRequestError(
        "این دوره رایگان نیست و باید از طریق سبد خرید پرداخت شود."
      );
    }

    const result = await repo.createEnrollment({
      userId: req.authUser!.id,
      courseId: course.id,
    });
    if (!result.created) {
      throw new ConflictError("شما قبلاً در این دوره ثبت‌نام کرده‌اید.");
    }

    await repo.createNotification({
      userId: req.authUser!.id,
      title: "ثبت‌نام موفق در دوره رایگان",
      message: `دسترسی شما به دوره «${course.title}» فعال شد.`,
      type: "COURSE",
      link: `/courses/${course.slug}`,
    });

    sendCreated(
      res,
      { enrolled: true, courseId: course.id },
      "ثبت‌نام رایگان در دوره با موفقیت انجام شد."
    );
  })
);

enrollmentsRouter.post(
  "/admin/enrollments",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: manualEnrollmentSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const { userId, courseId } = req.body;
    const [user, course] = await Promise.all([
      repo.findUserById(userId),
      repo.findCourseById(courseId),
    ]);
    if (!user) throw new NotFoundError("کاربر یافت نشد.");
    if (!course) throw new NotFoundError("دوره یافت نشد.");

    const result = await repo.createEnrollment({ userId, courseId });
    if (!result.created) {
      throw new ConflictError("این دانشجو قبلاً در این دوره ثبت‌نام شده است.");
    }

    await repo.createNotification({
      userId,
      title: "فعال‌سازی دسترسی دوره",
      message: `دسترسی دوره «${course.title}» توسط مدیریت برای شما فعال شد.`,
      type: "COURSE",
      link: `/courses/${course.slug}`,
    });

    sendCreated(res, { ok: true }, "دسترسی دوره برای دانشجو فعال شد.");
  })
);

enrollmentsRouter.delete(
  "/admin/enrollments",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: manualEnrollmentSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    await repo.deleteEnrollment(req.body.userId, req.body.courseId);
    sendSuccess(res, { ok: true }, "دسترسی دوره لغو شد.");
  })
);
