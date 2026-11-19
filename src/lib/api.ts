import {
  LocalApiError,
  dispatchLocalApiRequest,
  getDefaultStorage,
  type StorageAdapter,
} from "./localBackend";

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

const RAW_VITE_API_URL = String(import.meta.env?.VITE_API_URL ?? "").trim();
const HAS_EXPLICIT_REMOTE_API = /^https?:\/\//i.test(RAW_VITE_API_URL);

// Default to direct localStorage persistence on static deployments (zero /api/* network calls)
// unless an explicit external http(s):// VITE_API_URL backend is configured.
let useLocalFallbackMode = !HAS_EXPLICIT_REMOTE_API;
let customFallbackStorage: StorageAdapter | undefined;

export function isOfflineFallbackActive(): boolean {
  return useLocalFallbackMode;
}

export function resetOfflineFallbackState(
  storage?: StorageAdapter,
  forceRemoteMode = false
): void {
  useLocalFallbackMode = forceRemoteMode ? false : !HAS_EXPLICIT_REMOTE_API;
  customFallbackStorage = storage;
}

async function runLocalFallback<T>(
  url: string,
  options: RequestInit
): Promise<{ data: T; message?: string; meta?: PaginationMeta }> {
  try {
    const data = await dispatchLocalApiRequest<T>(
      url,
      options,
      customFallbackStorage ?? getDefaultStorage()
    );
    return { data };
  } catch (err) {
    if (err instanceof LocalApiError) {
      throw new ApiError(err.message, err.status, "LOCAL_API_ERROR");
    }
    throw new ApiError(
      err instanceof Error ? err.message : "خطا در پردازش محلی درخواست",
      500,
      "LOCAL_API_ERROR"
    );
  }
}

let inflightRefresh: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (useLocalFallbackMode) return false;
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
  // If already in localStorage fallback mode (offline / no DATABASE_URL on Netlify), serve immediately from localStorage
  if (useLocalFallbackMode) {
    return runLocalFallback<T>(url, options);
  }

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
      await new Promise((r) => setTimeout(r, 250));
      try {
        response = await fetch(requestUrl, fetchInit);
      } catch {
        useLocalFallbackMode = true;
        return runLocalFallback<T>(url, options);
      }
    } else {
      useLocalFallbackMode = true;
      return runLocalFallback<T>(url, options);
    }
  }

  // If Netlify Functions runs without DATABASE_URL (ephemeral memory-store), switch to localStorage persistence
  const storageMode = response.headers?.get("x-codeacademy-storage");
  if (storageMode === "memory-store") {
    useLocalFallbackMode = true;
    return runLocalFallback<T>(url, options);
  }

  // If gateway/serverless function crashes (5xx) or SPA fallback serves HTML instead of JSON, fall back to localStorage
  const contentType = response.headers?.get("content-type") || "";
  if (response.status >= 500 || contentType.includes("text/html")) {
    useLocalFallbackMode = true;
    return runLocalFallback<T>(url, options);
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
    // Non-JSON response (e.g. static hosting fallback without Functions)
    useLocalFallbackMode = true;
    return runLocalFallback<T>(url, options);
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
