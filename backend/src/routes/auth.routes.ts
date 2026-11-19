import { Router } from "express";
import { env } from "../config/env";
import { getRepository } from "../db";
import type { UserEntity } from "../db/repository";
import {
  type AuthenticatedRequest,
  authenticateOptional,
  requireAuth,
} from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { authRateLimiter } from "../middlewares/rateLimiter";
import { validate } from "../middlewares/validate";
import { sendEmail } from "../services/emailService";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import {
  createPrefixedId,
  generateOtpCode,
  hashPassword,
  sha256,
  verifyPassword,
} from "../utils/crypto";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";
import {
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyConfirmSchema,
  verifyRequestSchema,
} from "../validators/schemas";

export const authRouter = Router();

function serializePublicUser(u: UserEntity) {
  return {
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
  };
}

async function issueSessionAndCookies(
  req: AuthenticatedRequest,
  res: Parameters<typeof setAuthCookies>[0],
  user: UserEntity
) {
  const repo = getRepository();
  const sessionId = createPrefixedId("ses");
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    sessionId,
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    sessionId,
  });

  const expiresAt = new Date(
    Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000
  );

  await repo.createSession({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: sha256(refreshToken),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 250) || null,
    ipAddress: req.ip || null,
    expiresAt,
  });

  setAuthCookies(res, req, { accessToken, refreshToken });
  return { accessToken, refreshToken, sessionId };
}

authRouter.post(
  "/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const settings = await repo.getSettings();
    if (!settings.allowRegistration) {
      throw new ForbiddenError(
        "ثبت‌نام کاربران جدید در حال حاضر توسط مدیریت پلتفرم متوقف شده است."
      );
    }

    const { name, email, password, phone } = req.body;
    const user = await repo.createUser({
      name,
      email,
      phone: phone ? String(phone).trim() : null,
      passwordHash: hashPassword(password),
      role: "STUDENT",
    });

    await issueSessionAndCookies(req, res, user);

    // Issue email verification OTP
    const code = generateOtpCode();
    await repo.createVerificationToken({
      userId: user.id,
      purpose: "EMAIL_VERIFY",
      target: user.email,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendEmail({
      to: user.email,
      subject: "خوش‌آمدید به کدآکادمی · کد تایید حساب کاربری",
      text: `کد تایید حساب شما در کدآکادمی: ${code}`,
      html: `<p>سلام ${user.name} عزیز،</p><p>کد تایید حساب کاربری شما در کدآکادمی: <strong>${code}</strong></p>`,
    });

    await repo.createNotification({
      userId: user.id,
      title: "به کدآکادمی خوش آمدید!",
      message: "حساب کاربری شما با موفقیت ایجاد شد. برای امنیت بیشتر ایمیل خود را تایید کنید.",
      type: "AUTH",
      link: "/dashboard?tab=profile",
    });

    sendCreated(
      res,
      {
        user: serializePublicUser(user),
        enrolledCourseIds: [],
      },
      "حساب کاربری شما با موفقیت ایجاد شد."
    );
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const { email, password } = req.body;
    const user = await repo.findUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError("ایمیل یا رمز عبور اشتباه است.");
    }
    if (!user.isActive) {
      throw new ForbiddenError(
        "حساب کاربری شما غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید."
      );
    }

    await issueSessionAndCookies(req, res, user);
    const enrolledCourseIds = await repo.getEnrolledCourseIds(user.id);

    sendSuccess(
      res,
      {
        user: serializePublicUser(user),
        enrolledCourseIds,
      },
      "ورود با موفقیت انجام شد."
    );
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new UnauthorizedError("توکن تمدید نشست یافت نشد.");
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      clearAuthCookies(res, req);
      throw new UnauthorizedError("توکن تمدید نشست نامعتبر یا منقضی شده است.");
    }

    const repo = getRepository();
    const session = await repo.findSessionById(decoded.sessionId);
    if (
      !session ||
      session.revokedAt ||
      new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      clearAuthCookies(res, req);
      throw new UnauthorizedError("نشست کاربری منقضی یا لغو شده است.");
    }

    if (session.refreshTokenHash !== sha256(refreshToken)) {
      // Reuse detection: revoke compromised session immediately
      await repo.revokeSession(session.id);
      clearAuthCookies(res, req);
      throw new UnauthorizedError("تلاش غیرمجاز شناسایی شد. لطفاً مجدداً وارد شوید.");
    }

    const user = await repo.findUserById(session.userId);
    if (!user || !user.isActive) {
      clearAuthCookies(res, req);
      throw new UnauthorizedError("حساب کاربری معتبر نیست.");
    }

    const nextAccessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    });
    const nextRefreshToken = signRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });
    const nextExpiresAt = new Date(
      Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000
    );

    await repo.rotateSessionToken(
      session.id,
      sha256(nextRefreshToken),
      nextExpiresAt
    );

    setAuthCookies(res, req, {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    });

    sendSuccess(res, { refreshed: true }, "نشست کاربری تمدید شد.");
  })
);

authRouter.post(
  "/logout",
  authenticateOptional,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    if (req.authSessionId) {
      await repo.revokeSession(req.authSessionId);
    } else if (req.cookies?.[REFRESH_COOKIE_NAME]) {
      const decoded = verifyRefreshToken(req.cookies[REFRESH_COOKIE_NAME]);
      if (decoded?.sessionId) await repo.revokeSession(decoded.sessionId);
    }
    clearAuthCookies(res, req);
    sendSuccess(res, { ok: true }, "خروج از حساب کاربری با موفقیت انجام شد.");
  })
);

authRouter.post(
  "/logout-all",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    await repo.revokeAllUserSessions(req.authUser!.id);
    clearAuthCookies(res, req);
    sendSuccess(res, { ok: true }, "تمامی نشست‌های فعال شما بسته شدند.");
  })
);

authRouter.get(
  "/me",
  authenticateOptional,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.authUser) {
      sendSuccess(res, { user: null, enrolledCourseIds: [] });
      return;
    }
    const repo = getRepository();
    const enrolledCourseIds = await repo.getEnrolledCourseIds(req.authUser.id);
    sendSuccess(res, {
      user: serializePublicUser(req.authUser),
      enrolledCourseIds,
    });
  })
);

authRouter.post(
  "/verify/request",
  authRateLimiter,
  requireAuth,
  validate({ body: verifyRequestSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const user = req.authUser!;
    const { channel } = req.body;
    const target = channel === "phone" ? user.phone : user.email;
    if (!target) {
      throw new BadRequestError("ابتدا شماره موبایل خود را در پروفایل ثبت کنید.");
    }

    const code = generateOtpCode();
    await repo.createVerificationToken({
      userId: user.id,
      purpose: channel === "phone" ? "PHONE_VERIFY" : "EMAIL_VERIFY",
      target,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    if (channel === "email") {
      await sendEmail({
        to: user.email,
        subject: "کد تایید ایمیل کدآکادمی",
        text: `کد تایید شما: ${code}`,
        html: `<p>کد تایید ایمیل شما در کدآکادمی: <strong>${code}</strong></p>`,
      });
    }

    sendSuccess(
      res,
      {
        sentTo: target,
        channel,
        ...(env.isProduction ? {} : { devOtpPreview: code }),
      },
      "کد تایید با موفقیت ارسال شد."
    );
  })
);

authRouter.post(
  "/verify/confirm",
  authRateLimiter,
  requireAuth,
  validate({ body: verifyConfirmSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const user = req.authUser!;
    const { channel, code } = req.body;
    const purpose = channel === "phone" ? "PHONE_VERIFY" : "EMAIL_VERIFY";

    const tokenRow = await repo.findValidVerificationToken({
      userId: user.id,
      purpose,
      codeHash: sha256(code),
    });

    if (!tokenRow) {
      throw new BadRequestError("کد تایید نامعتبر یا منقضی شده است.");
    }

    await repo.consumeVerificationToken(tokenRow.id);
    const updated = await repo.markUserVerified(user.id, channel);

    sendSuccess(
      res,
      { user: serializePublicUser(updated) },
      channel === "email"
        ? "ایمیل شما با موفقیت تایید شد."
        : "شماره موبایل شما با موفقیت تایید شد."
    );
  })
);

authRouter.post(
  "/password/forgot",
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const user = await repo.findUserByEmail(req.body.email);

    let devOtpPreview: string | undefined;
    if (user && user.isActive) {
      const code = generateOtpCode();
      await repo.createVerificationToken({
        userId: user.id,
        purpose: "PASSWORD_RESET",
        target: user.email,
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + 20 * 60 * 1000),
      });
      await sendEmail({
        to: user.email,
        subject: "بازیابی رمز عبور کدآکادمی",
        text: `کد بازیابی رمز عبور شما: ${code}`,
        html: `<p>کد بازیابی رمز عبور شما در کدآکادمی: <strong>${code}</strong> (اعتبار ۲۰ دقیقه)</p>`,
      });
      if (!env.isProduction) {
        devOtpPreview = code;
      }
    }

    sendSuccess(
      res,
      {
        sent: true,
        ...(devOtpPreview ? { devOtpPreview } : {}),
      },
      "در صورت وجود حساب کاربری با این ایمیل، کد بازیابی رمز عبور ارسال شد."
    );
  })
);

authRouter.post(
  "/password/reset",
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const { email, code, newPassword } = req.body;
    const user = await repo.findUserByEmail(email);
    if (!user) {
      throw new BadRequestError("کد بازیابی یا ایمیل معتبر نیست.");
    }

    const tokenRow = await repo.findValidVerificationToken({
      userId: user.id,
      target: user.email,
      purpose: "PASSWORD_RESET",
      codeHash: sha256(code),
    });

    if (!tokenRow) {
      throw new BadRequestError("کد بازیابی نامعتبر یا منقضی شده است.");
    }

    await repo.consumeVerificationToken(tokenRow.id);
    await repo.updateUserPassword(user.id, hashPassword(newPassword));
    await repo.revokeAllUserSessions(user.id);

    sendSuccess(
      res,
      { ok: true },
      "رمز عبور شما با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید."
    );
  })
);

authRouter.patch(
  "/password/change",
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const user = req.authUser!;
    const { currentPassword, newPassword } = req.body;

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new BadRequestError("رمز عبور فعلی صحیح نیست.");
    }

    await repo.updateUserPassword(user.id, hashPassword(newPassword));
    sendSuccess(res, { ok: true }, "رمز عبور شما با موفقیت به‌روزرسانی شد.");
  })
);

authRouter.get(
  "/sessions",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const sessions = await repo.listUserSessions(req.authUser!.id);
    sendSuccess(res, {
      sessions: sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        isCurrent: s.id === req.authSessionId,
      })),
    });
  })
);

authRouter.delete(
  "/sessions/:id",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const repo = getRepository();
    const session = await repo.findSessionById(String(req.params.id));
    if (!session || session.userId !== req.authUser!.id) {
      throw new NotFoundError("نشست مورد نظر یافت نشد.");
    }
    await repo.revokeSession(session.id);
    if (session.id === req.authSessionId) {
      clearAuthCookies(res, req);
    }
    sendSuccess(res, { ok: true }, "نشست با موفقیت بسته شد.");
  })
);
