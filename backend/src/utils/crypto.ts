import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function createPrefixedId(prefix: string): string {
  const rand = crypto.randomBytes(6).toString("hex");
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
