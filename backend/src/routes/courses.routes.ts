import { Router } from "express";
import type { CourseLevel } from "../../../src/types";
import { getRepository } from "../db";
import type { CourseEntity } from "../db/repository";
import {
  type AuthenticatedRequest,
  authenticateOptional,
  requireAuth,
  requireRoles,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import {
  chapterSchema,
  courseCreateSchema,
  coursePublishSchema,
  courseUpdateSchema,
  lessonAttachmentSchema,
  lessonSchema,
} from "../validators/schemas";

export const coursesRouter = Router();

function canManageCourse(
  user: AuthenticatedRequest["authUser"] | undefined,
  course: CourseEntity
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return true;
  return false;
}

coursesRouter.get(
  "/courses/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) {
      sendSuccess(res, { courses: [] });
      return;
    }
    const repo = getRepository();
    const courses = await repo.searchCourses(q, 6);
    sendSuccess(res, { courses });
  })
);

coursesRouter.get(
  "/courses",
  authenticateOptional,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const categorySlug = String(req.query.category ?? "").trim() || undefined;
    const levelRaw = String(req.query.level ?? "").trim();
    const level = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"].includes(
      levelRaw
    )
      ? (levelRaw as CourseLevel)
      : undefined;
    const priceRaw = String(req.query.price ?? "").trim();
    const price =
      priceRaw === "free" || priceRaw === "paid" ? priceRaw : undefined;
    const sortRaw = String(req.query.sort ?? "newest").trim();
    const sort = ["newest", "popular", "cheapest", "highest_rated"].includes(
      sortRaw
    )
      ? (sortRaw as "newest" | "popular" | "cheapest" | "highest_rated")
      : "newest";
    const q = String(req.query.q ?? "").trim() || undefined;
    const featured = req.query.featured === "true";
    const includeUnpublished =
      req.query.includeUnpublished === "true" &&
      req.authUser?.role === "ADMIN";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const result = await repo.listCourses({
      categorySlug,
      level,
      price,
      sort,
      q,
      featured,
      includeUnpublished,
      page,
      limit,
    });

    sendSuccess(
      res,
      { courses: result.courses },
      "لیست دوره‌ها با موفقیت دریافت شد.",
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

coursesRouter.get(
  "/courses/:slug",
  authenticateOptional,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const slugParam = decodeURIComponent(String(req.params.slug ?? ""));
    const course = await repo.findCourseBySlugOrId(slugParam);

    const canManage = course ? canManageCourse(req.authUser, course) : false;
    if (!course || (!course.isPublished && !canManage)) {
      throw new NotFoundError("دوره مورد نظر یافت نشد.");
    }

    const isEnrolled = req.authUser
      ? canManage || (await repo.isUserEnrolled(req.authUser.id, course.id))
      : false;

    const reviews = await repo.listCourseReviews(course.id, false);
    const category =
      course.category ??
      (await repo.findCategoryById(course.categoryId)) ?? {
        id: course.categoryId,
        name: "برنامه‌نویسی",
        slug: "general",
      };

    sendSuccess(res, {
      course: {
        ...course,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        chapters: course.chapters.map((ch) => ({
          ...ch,
          lessons: ch.lessons.map((les) => {
            const unlocked = les.isFree || isEnrolled;
            return {
              ...les,
              videoUrl: unlocked ? les.videoUrl : "",
              codeSnippet: unlocked ? les.codeSnippet : "",
              attachments: unlocked ? les.attachments || [] : [],
            };
          }),
        })),
        reviews,
        isEnrolled,
      },
    });
  })
);

coursesRouter.get(
  "/lessons/:id/access",
  authenticateOptional,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const match = await repo.findLessonWithCourse(String(req.params.id));
    if (!match) throw new NotFoundError("جلسه مورد نظر یافت نشد.");

    const { lesson, course } = match;
    const isManager = canManageCourse(req.authUser, course);
    const enrolled = req.authUser
      ? isManager || (await repo.isUserEnrolled(req.authUser.id, course.id))
      : false;

    if (!lesson.isFree && !enrolled) {
      throw new ForbiddenError(
        "این جلسه فقط برای دانشجویان ثبت‌نام‌شده در دوره در دسترس است."
      );
    }

    sendSuccess(res, { lesson });
  })
);

// --- INSTRUCTOR COURSES ---
coursesRouter.get(
  "/instructor/courses",
  requireAuth,
  requireRoles("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const result = await repo.listCourses({
      includeUnpublished: true,
      instructorId:
        req.authUser!.role === "INSTRUCTOR" ? req.authUser!.id : undefined,
      page,
      limit,
    });
    sendSuccess(res, { courses: result.courses }, "دوره‌های مدرس دریافت شد.", 200, {
      page,
      limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / limit)),
    });
  })
);

// --- ADMIN & INSTRUCTOR COURSE MANAGEMENT ---
coursesRouter.get(
  "/admin/courses/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const course = await repo.findCourseById(String(req.params.id));
    if (!course) throw new NotFoundError("دوره یافت نشد.");
    if (!canManageCourse(req.authUser, course)) {
      throw new ForbiddenError("شما مجوز مدیریت این دوره را ندارید.");
    }
    sendSuccess(res, { course });
  })
);

coursesRouter.post(
  "/admin/courses",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: courseCreateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const body = req.body;
    const instructorId =
      req.authUser!.role === "INSTRUCTOR"
        ? req.authUser!.id
        : body.instructorId ?? req.authUser!.id;
    const course = await repo.createCourse({
      ...body,
      instructorId,
    });
    sendCreated(res, { course }, "دوره جدید با موفقیت ایجاد شد.");
  })
);

coursesRouter.put(
  "/admin/courses/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: courseUpdateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const existing = await repo.findCourseById(String(req.params.id));
    if (!existing) throw new NotFoundError("دوره یافت نشد.");
    if (!canManageCourse(req.authUser, existing)) {
      throw new ForbiddenError("شما مجوز ویرایش این دوره را ندارید.");
    }
    const course = await repo.updateCourse(existing.id, req.body);
    sendSuccess(res, { course }, "دوره با موفقیت به‌روزرسانی شد.");
  })
);

coursesRouter.patch(
  "/admin/courses/:id/publish",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: coursePublishSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const existing = await repo.findCourseById(String(req.params.id));
    if (!existing) throw new NotFoundError("دوره یافت نشد.");
    if (!canManageCourse(req.authUser, existing)) {
      throw new ForbiddenError("شما مجوز تغییر وضعیت انتشار این دوره را ندارید.");
    }
    const course = await repo.setCoursePublished(
      existing.id,
      req.body.isPublished
    );
    sendSuccess(
      res,
      { course },
      req.body.isPublished ? "دوره منتشر شد." : "دوره به پیش‌نویس منتقل شد."
    );
  })
);

coursesRouter.post(
  "/admin/courses/:id/duplicate",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const existing = await repo.findCourseById(String(req.params.id));
    if (!existing) throw new NotFoundError("دوره یافت نشد.");
    if (!canManageCourse(req.authUser, existing)) {
      throw new ForbiddenError("شما مجوز کپی این دوره را ندارید.");
    }
    const course = await repo.duplicateCourse(existing.id);
    sendCreated(res, { course }, "نسخه پیش‌نویس کپی از دوره ایجاد شد.");
  })
);

coursesRouter.delete(
  "/admin/courses/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const existing = await repo.findCourseById(String(req.params.id));
    if (!existing) throw new NotFoundError("دوره یافت نشد.");
    if (!canManageCourse(req.authUser, existing)) {
      throw new ForbiddenError("شما مجوز حذف این دوره را ندارید.");
    }
    await repo.deleteCourse(existing.id);
    sendSuccess(res, { ok: true }, "دوره با موفقیت حذف شد.");
  })
);

// --- CHAPTERS, LESSONS, ATTACHMENTS ---
coursesRouter.post(
  "/courses/:courseId/chapters",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: chapterSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const course = await repo.findCourseById(String(req.params.courseId));
    if (!course) throw new NotFoundError("دوره یافت نشد.");
    if (!canManageCourse(req.authUser, course)) {
      throw new ForbiddenError("مجوز دسترسی ندارید.");
    }
    const chapter = await repo.addChapter(course.id, req.body);
    sendCreated(res, { chapter }, "فصل جدید اضافه شد.");
  })
);

coursesRouter.put(
  "/chapters/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: chapterSchema.partial() }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const chapter = await repo.updateChapter(String(req.params.id), req.body);
    sendSuccess(res, { chapter }, "فصل ویرایش شد.");
  })
);

coursesRouter.delete(
  "/chapters/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    await repo.deleteChapter(String(req.params.id));
    sendSuccess(res, { ok: true }, "فصل حذف شد.");
  })
);

coursesRouter.post(
  "/chapters/:chapterId/lessons",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: lessonSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const lesson = await repo.addLesson(String(req.params.chapterId), req.body);
    sendCreated(res, { lesson }, "جلسه جدید اضافه شد.");
  })
);

coursesRouter.put(
  "/lessons/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: lessonSchema.partial() }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const lesson = await repo.updateLesson(String(req.params.id), req.body);
    sendSuccess(res, { lesson }, "جلسه ویرایش شد.");
  })
);

coursesRouter.delete(
  "/lessons/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    await repo.deleteLesson(String(req.params.id));
    sendSuccess(res, { ok: true }, "جلسه حذف شد.");
  })
);

coursesRouter.post(
  "/lessons/:lessonId/attachments",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  validate({ body: lessonAttachmentSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const match = await repo.findLessonWithCourse(String(req.params.lessonId));
    if (!match) throw new NotFoundError("جلسه یافت نشد.");
    if (!canManageCourse(req.authUser, match.course)) {
      throw new ForbiddenError("مجوز افزودن فایل به این دوره را ندارید.");
    }
    const attachment = await repo.addLessonAttachment({
      lessonId: match.lesson.id,
      title: req.body.title,
      fileUrl: req.body.fileUrl,
      fileType: req.body.fileType,
      fileSize: req.body.fileSize,
    });
    sendCreated(res, { attachment }, "فایل ضمیمه اضافه شد.");
  })
);

coursesRouter.delete(
  "/attachments/:id",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    await repo.deleteLessonAttachment(String(req.params.id));
    sendSuccess(res, { ok: true }, "فایل ضمیمه حذف شد.");
  })
);
