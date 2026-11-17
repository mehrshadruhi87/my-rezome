const AUTH_TOKEN_KEY = "codeacademy_auth_token";

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

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      setAuthToken(null);
    }
    throw new Error(data.error || "خطایی در ارتباط با سرور رخ داد.");
  }
  return data as T;
}
