import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../config/env";
import type { UserRole } from "../db/repository";

export const ACCESS_COOKIE_NAME = "ca_access_token";
export const REFRESH_COOKIE_NAME = "ca_refresh_token";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sessionId: string;
  type: "access";
  jti?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: "refresh";
  jti?: string;
}

export function signAccessToken(payload: {
  userId: string;
  role: UserRole;
  sessionId: string;
}): string {
  const tokenPayload: AccessTokenPayload = {
    sub: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
    type: "access",
  };
  return jwt.sign(tokenPayload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"],
    jwtid: crypto.randomUUID(),
  });
}

export function signRefreshToken(payload: {
  userId: string;
  sessionId: string;
}): string {
  const tokenPayload: RefreshTokenPayload = {
    sub: payload.userId,
    sessionId: payload.sessionId,
    type: "refresh",
  };
  return jwt.sign(tokenPayload, env.jwtRefreshSecret, {
    expiresIn: `${env.jwtRefreshExpiresDays}d`,
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
    if (decoded?.type !== "access" || !decoded.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      env.jwtRefreshSecret
    ) as RefreshTokenPayload;
    if (decoded?.type !== "refresh" || !decoded.sub || !decoded.sessionId) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  if (proto.includes("https")) return true;
  const origin = String(req.headers["origin"] || "").toLowerCase();
  const referer = String(req.headers["referer"] || "").toLowerCase();
  return origin.startsWith("https://") || referer.startsWith("https://");
}

export function setAuthCookies(
  res: Response,
  req: Request,
  tokens: { accessToken: string; refreshToken: string }
): void {
  const secure = env.isProduction || isHttpsRequest(req);
  const sameSite: "none" | "lax" = secure ? "none" : "lax";
  const refreshMaxAgeMs = env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: refreshMaxAgeMs,
  });
}

export function clearAuthCookies(res: Response, req: Request): void {
  const secure = env.isProduction || isHttpsRequest(req);
  const sameSite: "none" | "lax" = secure ? "none" : "lax";
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  });
}
