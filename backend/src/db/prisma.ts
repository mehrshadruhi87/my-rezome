import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __codeacademyPrisma: PrismaClient | undefined;
}

export function hasDatabaseConfigured(): boolean {
  const url = env.databaseUrl;
  if (!url || !url.startsWith("postgres")) return false;
  if (url.includes("USER:PASSWORD@HOST")) return false;
  try {
    const parsed = new URL(url);
    return Boolean(parsed.hostname && parsed.hostname !== "HOST");
  } catch {
    return false;
  }
}

export function getPrismaClient(): PrismaClient {
  if (!hasDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL تنظیم نشده است. برای اتصال به PostgreSQL متغیر DATABASE_URL را در محیط قرار دهید."
    );
  }

  if (!globalThis.__codeacademyPrisma) {
    globalThis.__codeacademyPrisma = new PrismaClient({
      log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return globalThis.__codeacademyPrisma;
}
