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
import { broadcastNotificationSchema } from "../validators/schemas";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const result = await repo.listUserNotifications(req.authUser!.id, limit);
    sendSuccess(res, result);
  })
);

notificationsRouter.patch(
  "/notifications/:id/read",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    await repo.markNotificationRead(req.authUser!.id, String(req.params.id));
    sendSuccess(res, { ok: true }, "اعلان خوانده شد.");
  })
);

notificationsRouter.patch(
  "/notifications/read-all",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    await repo.markAllNotificationsRead(req.authUser!.id);
    sendSuccess(res, { ok: true }, "همه اعلان‌ها به عنوان خوانده‌شده علامت خوردند.");
  })
);

notificationsRouter.post(
  "/admin/notifications/broadcast",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: broadcastNotificationSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const count = await repo.broadcastNotification({
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      link: req.body.link || null,
      targetRole: req.body.targetRole,
    });
    sendCreated(
      res,
      { deliveredCount: count },
      `اعلان با موفقیت برای ${count} کاربر ارسال شد.`
    );
  })
);
