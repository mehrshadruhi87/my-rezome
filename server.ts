import express, { type Request, type Response } from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: "ok",
      storage: "supabase-client",
    });
  });

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
