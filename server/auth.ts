import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { readDb, type DbUser } from "./db";
import type { PublicUser, UserRole } from "../src/types";

const SESSION_COOKIE = "ca_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "codeacademy-persian-dev-secret-2026";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(userId: string, role: UserRole): string {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encoded)
      .digest("base64url");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    ) as SessionPayload;
    if (!payload.userId || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function isSecureRequest(req?: Request): boolean {
  if (!req) return false;
  if (req.secure) return true;
  const proto = req.headers["x-forwarded-proto"];
  if (typeof proto === "string" && proto.split(",")[0].trim() === "https") {
    return true;
  }
  return false;
}

export function setSessionCookie(
  res: Response,
  token: string,
  req?: Request
): void {
  const secure = isSecureRequest(req);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: TOKEN_TTL_MS,
  });
}

export function clearSessionCookie(res: Response, req?: Request): void {
  const secure = isSecureRequest(req);
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  });
}

export function toPublicUser(user: DbUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

export function getAuthenticatedUser(req: Request): DbUser | null {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies[SESSION_COOKIE];

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const db = readDb();
  return db.users.find((u) => u.id === payload.userId) ?? null;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "برای ادامه ابتدا وارد حساب کاربری خود شوید." });
    return;
  }
  (req as Request & { currentUser: DbUser }).currentUser = user;
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "ابتدا وارد حساب کاربری خود شوید." });
    return;
  }
  if (user.role !== "ADMIN") {
    res
      .status(403)
      .json({ error: "عدم دسترسی: فقط مدیر سیستم مجاز به انجام این عملیات است." });
    return;
  }
  (req as Request & { currentUser: DbUser }).currentUser = user;
  next();
}
