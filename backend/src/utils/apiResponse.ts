import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: {
    code: string;
    details?: unknown;
  } | null;
  meta?: PaginationMeta;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "عملیات با موفقیت انجام شد.",
  statusCode = 200,
  meta?: PaginationMeta
): void {
  const payload: ApiEnvelope<T> = {
    success: true,
    message,
    data,
    error: null,
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(payload);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = "اطلاعات با موفقیت ثبت شد."
): void {
  sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code = "INTERNAL_ERROR",
  details?: unknown
): void {
  const payload: ApiEnvelope<null> = {
    success: false,
    message,
    data: null,
    error: {
      code,
      ...(details !== undefined ? { details } : {}),
    },
  };
  res.status(statusCode).json(payload);
}
