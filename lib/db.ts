// Prisma singleton — avoids exhausting connections during Next.js hot reload.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "";
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT);

  // If running in a serverless environment (e.g. Vercel) with a local SQLite database (file:...),
  // copy the seeded SQLite database to /tmp (the only writable directory in Lambda/Vercel)
  // so SQLite can create journal/WAL files without triggering Error code 14 (SQLITE_CANTOPEN).
  if (isServerless && (!dbUrl || dbUrl.startsWith("file:"))) {
    try {
      const tmpDir = os.tmpdir();
      const targetDbPath = path.join(tmpDir, "dev.db");

      if (!fs.existsSync(targetDbPath)) {
        const candidatePaths = [
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join(process.cwd(), "dev.db"),
          path.join(__dirname, "..", "prisma", "dev.db"),
          path.join(__dirname, "dev.db"),
        ];

        let copied = false;
        for (const candidate of candidatePaths) {
          if (fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, targetDbPath);
            copied = true;
            break;
          }
        }

        if (!copied) {
          fs.closeSync(fs.openSync(targetDbPath, "w"));
        }
      }

      const formattedUrl = `file:${targetDbPath.replace(/\\/g, "/")}`;
      return new PrismaClient({
        datasources: {
          db: {
            url: formattedUrl,
          },
        },
      });
    } catch (err) {
      console.warn("[lib/db] Failed to prepare serverless SQLite in /tmp:", err);
    }
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

