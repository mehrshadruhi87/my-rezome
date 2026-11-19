export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StandardApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code?: string;
    details?: unknown;
  } | null;
  meta?: PaginationMeta;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status = 400,
    code = "API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL = (
  import.meta.env?.VITE_API_URL || "/api"
).replace(/\/+$/, "");

export function resolveApiUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/api/")) {
    return `${API_BASE_URL}${url.slice(4)}`;
  }
  if (url === "/api") {
    return API_BASE_URL;
  }
  return url;
}

// Legacy no-op exports kept only for signature compatibility; sessions live in HttpOnly cookies
export function getAuthToken(): string | null {
  return null;
}
export function setAuthToken(_token: string | null): void {
  // Handled securely via HttpOnly cookies
}

let inflightRefresh: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const res = await fetch(resolveApiUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

export async function apiRequestWithMeta<T>(
  url: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<{ data: T; message?: string; meta?: PaginationMeta }> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  const requestUrl = resolveApiUrl(url);
  const fetchInit: RequestInit = {
    ...options,
    credentials: "include",
    headers,
  };
  const isGetRequest =
    !options.method || options.method.toUpperCase() === "GET";

  try {
    response = await fetch(requestUrl, fetchInit);
  } catch {
    if (isGetRequest) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        response = await fetch(requestUrl, fetchInit);
      } catch {
        throw new ApiError(
          "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.",
          0,
          "NETWORK_ERROR"
        );
      }
    } else {
      throw new ApiError(
        "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.",
        0,
        "NETWORK_ERROR"
      );
    }
  }

  const isAuthEndpoint =
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh");

  if (response.status === 401 && allowRefresh && !isAuthEndpoint) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return apiRequestWithMeta<T>(url, options, false);
    }
  }

  let parsed: StandardApiEnvelope<T> | Record<string, unknown> | null = null;
  try {
    parsed = (await response.json()) as StandardApiEnvelope<T>;
  } catch {
    parsed = null;
  }

  if (
    !response.ok ||
    (parsed && "success" in parsed && parsed.success === false)
  ) {
    const message =
      (parsed && "message" in parsed && typeof parsed.message === "string"
        ? parsed.message
        : null) ||
      (parsed && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : null) ||
      `خطای سرور (${response.status})`;
    const code =
      parsed &&
      "error" in parsed &&
      parsed.error &&
      typeof parsed.error === "object" &&
      "code" in parsed.error
        ? String(parsed.error.code || "API_ERROR")
        : "API_ERROR";
    const details =
      parsed &&
      "error" in parsed &&
      parsed.error &&
      typeof parsed.error === "object" &&
      "details" in parsed.error
        ? parsed.error.details
        : undefined;
    throw new ApiError(message, response.status, code, details);
  }

  if (parsed && "success" in parsed && "data" in parsed) {
    const envelope = parsed as StandardApiEnvelope<T>;
    return {
      data: envelope.data,
      message: envelope.message,
      meta: envelope.meta,
    };
  }

  return { data: parsed as T };
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const result = await apiRequestWithMeta<T>(url, options);
  return result.data;
}
