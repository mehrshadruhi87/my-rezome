import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CategoryItem, PlatformSettings, PublicUser } from "../types";
import { apiRequest, setAuthToken } from "../lib/api";
import {
  DEFAULT_PLATFORM_SETTINGS,
  applyPlatformSettingsToDocument,
  mergePlatformSettings,
} from "../utils/themeSettings";

interface AuthContextValue {
  user: PublicUser | null;
  categories: CategoryItem[];
  enrolledCourseIds: string[];
  settings: PlatformSettings;
  loading: boolean;
  refreshBootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<PublicUser>;
  logout: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
  previewSettings: (next: PlatformSettings) => void;
  updateSettingsState: (next: PlatformSettings) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(
    DEFAULT_PLATFORM_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPlatformSettingsToDocument(settings);
  }, [settings]);

  const refreshBootstrap = useCallback(async () => {
    try {
      const data = await apiRequest<{
        categories: CategoryItem[];
        user: PublicUser | null;
        enrolledCourseIds: string[];
        settings?: PlatformSettings;
      }>("/api/bootstrap");
      setCategories(data.categories);
      setUser(data.user);
      setEnrolledCourseIds(data.enrolledCourseIds);
      if (data.settings) {
        setSettings(mergePlatformSettings(data.settings));
      }
      if (!data.user) {
        setAuthToken(null);
      }
    } catch {
      // Keep current state on transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{
      user: PublicUser;
      enrolledCourseIds: string[];
      token?: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    setEnrolledCourseIds(data.enrolledCourseIds);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const data = await apiRequest<{
        user: PublicUser;
        enrolledCourseIds: string[];
        token?: string;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setEnrolledCourseIds(data.enrolledCourseIds);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear local session state even if network request fails
    } finally {
      setAuthToken(null);
      setUser(null);
      setEnrolledCourseIds([]);
    }
  }, []);

  const previewSettings = useCallback((next: PlatformSettings) => {
    setSettings(mergePlatformSettings(next));
  }, []);

  const updateSettingsState = useCallback((next: PlatformSettings) => {
    setSettings(mergePlatformSettings(next));
  }, []);

  const value = useMemo(
    () => ({
      user,
      categories,
      enrolledCourseIds,
      settings,
      loading,
      refreshBootstrap,
      login,
      register,
      logout,
      setUser,
      previewSettings,
      updateSettingsState,
    }),
    [
      user,
      categories,
      enrolledCourseIds,
      settings,
      loading,
      refreshBootstrap,
      login,
      register,
      logout,
      previewSettings,
      updateSettingsState,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
