import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import {
  fallbackToDevRepository,
  getActiveDatabaseType,
  getRepository,
} from "./db";
import { renderSwaggerHtml, swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { authRouter } from "./routes/auth.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { coursesRouter } from "./routes/courses.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { enrollmentsRouter } from "./routes/enrollments.routes";
import { notificationsRouter } from "./routes/notifications.routes";
import { ordersRouter } from "./routes/orders.routes";
import { reviewsRouter } from "./routes/reviews.routes";
import { usersRouter } from "./routes/users.routes";
import { sendError } from "./utils/apiResponse";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  // Normalize Netlify Functions base path (/.netlify/functions/api/... -> /api/...)
  app.use((req, _res, next) => {
    if (req.url.startsWith("/.netlify/functions/api")) {
      const rest = req.url.slice("/.netlify/functions/api".length) || "/";
      req.url = `/api${rest.startsWith("/") ? rest : `/${rest}`}`;
    }
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      xFrameOptions: false,
    })
  );

  app.use(
    cors((req, callback) => {
      const origin = req.header("origin");
      if (!origin) {
        callback(null, { origin: true, credentials: true });
        return;
      }

      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        callback(null, { origin: false });
        return;
      }

      const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
      const requestHost = forwardedHost || req.get("host") || "";

      const isAllowed =
        (requestHost && originHost === requestHost) ||
        env.corsOrigins.includes(origin) ||
        /^https:\/\/([a-z0-9-]+--)?codeacademy-ir\.netlify\.app$/i.test(origin) ||
        /^https:\/\/[a-z0-9.-]+\.run\.app$/i.test(origin) ||
        (!env.isServerless &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin));

      callback(null, { origin: isAllowed, credentials: true });
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Swagger OpenAPI docs
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
  app.get("/api/docs", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderSwaggerHtml("/api/docs.json"));
  });

  // Rate limit API requests
  app.use("/api", apiRateLimiter);

  // Lazy one-time seed check when PostgreSQL tables are empty on cold start.
  // If PostgreSQL is unavailable or Prisma is ungenerated, fall back gracefully without crashing.
  let seedCheckDone = false;
  let inflightSeed: Promise<void> | null = null;
  app.use("/api", async (_req, res, next) => {
    if (!seedCheckDone) {
      try {
        const repo = getRepository();
        if (repo.ensureSeeded) {
          if (!inflightSeed) {
            inflightSeed = repo.ensureSeeded().finally(() => {
              inflightSeed = null;
            });
          }
          await inflightSeed;
        }
        seedCheckDone = true;
      } catch (err) {
        console.warn(
          "Database cold-start check failed; switching to graceful fallback store:",
          err instanceof Error ? err.message : err
        );
        fallbackToDevRepository();
        seedCheckDone = true;
      }
    }
    res.setHeader("X-CodeAcademy-Storage", getActiveDatabaseType());
    next();
  });

  // Mount domain routers under /api
  const api = express.Router();
  api.use("/auth", authRouter);
  api.use(usersRouter);
  api.use(categoriesRouter);
  api.use(coursesRouter);
  api.use(enrollmentsRouter);
  api.use(ordersRouter);
  api.use(reviewsRouter);
  api.use(notificationsRouter);
  api.use(dashboardRouter);

  app.use("/api", api);

  // Unmatched API routes return standard 404 JSON envelope
  app.use("/api", (_req: Request, res: Response) => {
    sendError(res, 404, "مسیر API مورد نظر یافت نشد.", "ROUTE_NOT_FOUND");
  });

  app.use(errorHandler);
  return app;
}
