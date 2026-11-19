import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { BadRequestError } from "../utils/errors";

export interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (!parsed.success) {
        next(
          new BadRequestError(
            parsed.error.issues[0]?.message || "پارامترهای مسیر نامعتبر هستند.",
            parsed.error.issues
          )
        );
        return;
      }
      req.params = parsed.data as Record<string, string>;
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (!parsed.success) {
        next(
          new BadRequestError(
            parsed.error.issues[0]?.message || "پارامترهای جستجو نامعتبر هستند.",
            parsed.error.issues
          )
        );
        return;
      }
      (req as Request & { validatedQuery?: unknown }).validatedQuery =
        parsed.data;
    }

    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body ?? {});
      if (!parsed.success) {
        next(
          new BadRequestError(
            parsed.error.issues[0]?.message || "اطلاعات ورودی معتبر نیست.",
            parsed.error.issues
          )
        );
        return;
      }
      req.body = parsed.data;
    }

    next();
  };
}
