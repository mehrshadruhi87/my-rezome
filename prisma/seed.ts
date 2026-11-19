import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { seedDatabaseIfEmpty } from "../backend/src/db/prismaSeed";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  await seedDatabaseIfEmpty(prisma, { forceLog: true });
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
