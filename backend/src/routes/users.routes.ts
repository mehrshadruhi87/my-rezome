import { Router } from "express";
import { getRepository } from "../db";
import type { UserRole } from "../db/repository";
import {
  type AuthenticatedRequest,
  requireAuth,
  requireRoles,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { sendSuccess } from "../utils/apiResponse";
import {
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../validators/schemas";

export const usersRouter = Router();

usersRouter.get(
  "/profile",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const u = req.authUser!;
    sendSuccess(res, {
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        isEmailVerified: u.isEmailVerified,
        isPhoneVerified: u.isPhoneVerified,
        isActive: u.isActive,
        createdAt: u.createdAt,
      },
    });
  })
);

usersRouter.put(
  "/profile",
  requireAuth,
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const updated = await repo.updateUserProfile(req.authUser!.id, {
      name: req.body.name,
      phone: req.body.phone !== undefined ? req.body.phone || null : undefined,
      bio: req.body.bio !== undefined ? req.body.bio || null : undefined,
      avatarUrl:
        req.body.avatarUrl !== undefined
          ? req.body.avatarUrl || null
          : undefined,
    });
    sendSuccess(
      res,
      {
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          phone: updated.phone,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl,
          isEmailVerified: updated.isEmailVerified,
          isPhoneVerified: updated.isPhoneVerified,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
        },
      },
      "پروفایل کاربری با موفقیت به‌روزرسانی شد."
    );
  })
);

usersRouter.get(
  "/admin/users",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const q = String(req.query.q || "").trim() || undefined;
    const roleRaw = String(req.query.role || "").trim();
    const role =
      roleRaw === "ADMIN" || roleRaw === "INSTRUCTOR" || roleRaw === "STUDENT"
        ? (roleRaw as UserRole)
        : undefined;

    const result = await repo.listUsers({ q, role, page, limit });
    sendSuccess(
      res,
      {
        users: result.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          isEmailVerified: u.isEmailVerified,
          isPhoneVerified: u.isPhoneVerified,
          isActive: u.isActive,
          createdAt: u.createdAt,
          enrolledCourseIds: u.enrolledCourseIds,
          ordersCount: u.ordersCount,
        })),
      },
      "لیست کاربران دریافت شد.",
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

usersRouter.patch(
  "/admin/users/:id/role",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: updateUserRoleSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const updated = await repo.updateUserRole(
      String(req.params.id),
      req.body.role
    );
    sendSuccess(
      res,
      {
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          phone: updated.phone,
          bio: updated.bio,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
        },
      },
      "نقش کاربر با موفقیت تغییر یافت."
    );
  })
);

usersRouter.patch(
  "/admin/users/:id/status",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: updateUserStatusSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const updated = await repo.updateUserStatus(
      String(req.params.id),
      req.body.isActive
    );
    if (!req.body.isActive) {
      await repo.revokeAllUserSessions(updated.id);
    }
    sendSuccess(
      res,
      {
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          isActive: updated.isActive,
        },
      },
      updated.isActive ? "حساب کاربر فعال شد." : "حساب کاربر مسدود شد."
    );
  })
);
