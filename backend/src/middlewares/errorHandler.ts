import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { sendError } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void> | void
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  if (err instanceof multer.MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "حجم فایل ارسالی بیش از سقف مجاز است."
        : "خطا در پردازش فایل ارسالی.";
    sendError(res, 400, msg, "UPLOAD_ERROR");
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: string }).code === "string"
  ) {
    const prismaCode = (err as { code: string }).code;
    if (prismaCode === "P2002") {
      sendError(res, 409, "این مقدار قبلاً در سیستم ثبت شده است.", "CONFLICT");
      return;
    }
    if (prismaCode === "P2025") {
      sendError(res, 404, "رکورد مورد نظر یافت نشد.", "NOT_FOUND");
      return;
    }
  }

  console.error("[API_ERROR]", err);
  const message =
    err instanceof Error && process.env.NODE_ENV !== "production"
      ? err.message
      : "خطای داخلی سرور رخ داد.";
  sendError(res, 500, message, "INTERNAL_SERVER_ERROR");
}
