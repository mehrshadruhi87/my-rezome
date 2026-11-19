import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.",
      "RATE_LIMIT_EXCEEDED"
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      "تلاش‌های متعدد برای احراز هویت ثبت شد. لطفاً ۱۵ دقیقه دیگر مجدداً تلاش کنید.",
      "AUTH_RATE_LIMIT_EXCEEDED"
    );
  },
});
