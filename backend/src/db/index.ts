import { env } from "../config/env";
import { DevFileRepository } from "./devFileRepository";
import { hasDatabaseConfigured } from "./prisma";
import { PrismaRepository } from "./prismaRepository";
import type { IRepository } from "./repository";

let repositoryInstance: IRepository | null = null;
let activeBackendType: "postgresql-prisma" | "dev-store" = "dev-store";

export function getRepository(): IRepository {
  if (repositoryInstance) return repositoryInstance;

  if (hasDatabaseConfigured()) {
    repositoryInstance = new PrismaRepository();
    activeBackendType = "postgresql-prisma";
    return repositoryInstance;
  }

  if (env.isServerless) {
    throw new Error(
      "DATABASE_URL is required in Netlify Functions. Configure your Neon or Supabase PostgreSQL connection string."
    );
  }

  repositoryInstance = new DevFileRepository();
  activeBackendType = "dev-store";
  return repositoryInstance;
}

export function fallbackToDevRepository(): IRepository {
  repositoryInstance = new DevFileRepository();
  activeBackendType = "dev-store";
  return repositoryInstance;
}

export function getActiveDatabaseType(): "postgresql-prisma" | "dev-store" {
  return activeBackendType;
}

export function setRepositoryForTests(repo: IRepository | null): void {
  repositoryInstance = repo;
  activeBackendType = "dev-store";
}
