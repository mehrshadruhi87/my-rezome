import express, { type Request, type Response } from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { createApp } from "./backend/src/app";
import { env } from "./backend/src/config/env";
import {
  fallbackToDevRepository,
  getRepository,
} from "./backend/src/db";

async function startServer() {
  const app = createApp();
  const port = env.port;

  // Warm repository connection / seed state on boot without crashing preview on transient/offline DB
  try {
    await getRepository().ping();
  } catch (err) {
    console.warn(
      "[CodeAcademy] Primary database ping failed on startup; falling back to local dev store:",
      err instanceof Error ? err.message : err
    );
    await fallbackToDevRepository().ping();
  }

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`CodeAcademy server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start CodeAcademy server:", err);
  process.exit(1);
});
