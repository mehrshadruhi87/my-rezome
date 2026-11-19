import type { NextFunction, Request, Response } from "express";
import { getRepository } from "../db";
import type { UserEntity, UserRole } from "../db/repository";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  authUser?: UserEntity;
  authSessionId?: string;
}

export function extractAccessToken(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  return null;
}

export async function authenticateOptional(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      next();
      return;
    }
    const payload = verifyAccessToken(token);
    if (!payload) {
      next();
      return;
    }
    const repo = getRepository();
    const [user, session] = await Promise.all([
      repo.findUserById(payload.sub),
      repo.findSessionById(payload.sessionId),
    ]);
    if (
      user &&
      user.isActive &&
      session &&
      !session.revokedAt &&
      new Date(session.expiresAt).getTime() > Date.now()
    ) {
      req.authUser = user;
      req.authSessionId = session.id;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authenticateOptional(req, res, () => {});
    if (!req.authUser) {
      next(new UnauthorizedError("برای ادامه ابتدا وارد حساب کاربری خود شوید."));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.authUser) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      next(
        new ForbiddenError("سطح دسترسی شما برای این عملیات کافی نیست.")
      );
      return;
    }
    next();
  };
}
