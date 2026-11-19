import { Router } from "express";
import {
  DEFAULT_PLATFORM_SETTINGS,
  mergePlatformSettings,
} from "../../../src/utils/themeSettings";
import { getActiveDatabaseType, getRepository } from "../db";
import {
  type AuthenticatedRequest,
  authenticateOptional,
  requireAuth,
  requireRoles,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { uploadFileToCloud, uploadMiddleware } from "../services/storageService";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { BadRequestError } from "../utils/errors";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const repo = getRepository();
    const dbReady = await repo.ping();
    sendSuccess(res, {
      ok: dbReady,
      database: getActiveDatabaseType(),
      timestamp: new Date().toISOString(),
    });
  })
);

dashboardRouter.get(
  "/bootstrap",
  authenticateOptional,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const [categories, settings, enrolledCourseIds] = await Promise.all([
      repo.listCategories(false),
      repo.getSettings(),
      req.authUser ? repo.getEnrolledCourseIds(req.authUser.id) : Promise.resolve([]),
    ]);

    const user = req.authUser
      ? {
          id: req.authUser.id,
          name: req.authUser.name,
          email: req.authUser.email,
          role: req.authUser.role,
          phone: req.authUser.phone,
          bio: req.authUser.bio,
          avatarUrl: req.authUser.avatarUrl,
          isEmailVerified: req.authUser.isEmailVerified,
          isPhoneVerified: req.authUser.isPhoneVerified,
          isActive: req.authUser.isActive,
          createdAt: req.authUser.createdAt,
        }
      : null;

    sendSuccess(res, {
      categories,
      user,
      enrolledCourseIds,
      settings,
    });
  })
);

dashboardRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const repo = getRepository();
    const settings = await repo.getSettings();
    sendSuccess(res, { settings });
  })
);

dashboardRouter.put(
  "/admin/settings",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const current = await repo.getSettings();
    const next = mergePlatformSettings({
      ...current,
      ...(req.body || {}),
    });
    const saved = await repo.updateSettings(next);
    sendSuccess(res, { settings: saved }, "تنظیمات پلتفرم ذخیره شد.");
  })
);

dashboardRouter.post(
  "/admin/settings/reset",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (_req, res) => {
    const repo = getRepository();
    const saved = await repo.updateSettings({ ...DEFAULT_PLATFORM_SETTINGS });
    sendSuccess(res, { settings: saved }, "تنظیمات به حالت پیش‌فرض بازنشانی شد.");
  })
);

dashboardRouter.get(
  "/admin/overview",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (_req, res) => {
    const repo = getRepository();
    const overview = await repo.getAdminOverview();
    sendSuccess(res, overview);
  })
);

dashboardRouter.get(
  "/instructor/overview",
  requireAuth,
  requireRoles("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const overview = await repo.getInstructorOverview(req.authUser!.id);
    sendSuccess(res, overview);
  })
);

dashboardRouter.post(
  "/uploads",
  requireAuth,
  requireRoles("ADMIN", "INSTRUCTOR"),
  uploadMiddleware.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError("هیچ فایلی برای آپلود ارسال نشده است.");
    }
    const folder = String(req.body?.folder || "courses")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40) || "courses";

    const uploaded = await uploadFileToCloud(req.file, folder);
    sendCreated(res, uploaded, "فایل با موفقیت آپلود شد.");
  })
);
