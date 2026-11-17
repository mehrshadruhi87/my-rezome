import {
  AUTH_TOKEN_KEY,
  LocalApiError,
  dispatchLocalApiRequest,
} from "./localBackend";

export function getAuthToken(): string | null {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota or sandbox restrictions
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await dispatchLocalApiRequest<T>(url, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err instanceof LocalApiError && err.status === 401) {
      setAuthToken(null);
    }
    throw err;
  }
}
