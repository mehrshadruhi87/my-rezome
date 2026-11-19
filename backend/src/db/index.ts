import { env } from "../config/env";
import { DevFileRepository } from "./devFileRepository";
import { hasDatabaseConfigured } from "./prisma";
import { PrismaRepository } from "./prismaRepository";
import type { IRepository } from "./repository";

export type ActiveDatabaseType =
  | "postgresql-prisma"
  | "dev-store"
  | "memory-store";

let repositoryInstance: IRepository | null = null;
let activeBackendType: ActiveDatabaseType = "dev-store";

export function getRepository(): IRepository {
  if (repositoryInstance) return repositoryInstance;

  if (hasDatabaseConfigured()) {
    try {
      repositoryInstance = new PrismaRepository();
      activeBackendType = "postgresql-prisma";
      return repositoryInstance;
    } catch (err) {
      console.warn(
        "Prisma repository initialization failed; falling back gracefully:",
        err instanceof Error ? err.message : err
      );
    }
  }

  if (env.isServerless) {
    repositoryInstance = new DevFileRepository({ inMemory: true });
    activeBackendType = "memory-store";
    return repositoryInstance;
  }

  repositoryInstance = new DevFileRepository();
  activeBackendType = "dev-store";
  return repositoryInstance;
}

export function fallbackToDevRepository(): IRepository {
  if (env.isServerless) {
    repositoryInstance = new DevFileRepository({ inMemory: true });
    activeBackendType = "memory-store";
    return repositoryInstance;
  }
  repositoryInstance = new DevFileRepository();
  activeBackendType = "dev-store";
  return repositoryInstance;
}

export function getActiveDatabaseType(): ActiveDatabaseType {
  return activeBackendType;
}

export function setRepositoryForTests(repo: IRepository | null): void {
  repositoryInstance = repo;
  activeBackendType = "dev-store";
}
