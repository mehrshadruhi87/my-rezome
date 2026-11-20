import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { CategoryItem, PlatformSettings, PublicUser } from "../types";
import { apiRequest } from "../lib/api";
import { supabase } from "../lib/supabase";
import {
  isPasswordRecoveryUrl,
  mapSupabaseAuthUserToPublicUser,
  translateSupabaseAuthError,
  validateAuthEmail,
  validateAuthPassword,
} from "../lib/supabaseAuth";
import {
  fetchSupabaseUserByEmail,
  insertSupabaseUser,
  normalizeEnrolledCourses,
  normalizeRole,
} from "../lib/supabaseStore";
import {
  recordInstructorApplicationForSupabaseUser,
  syncSupabaseAuthSessionToLocalStore,
} from "../lib/localBackend";
import {
  DEFAULT_PLATFORM_SETTINGS,
  applyPlatformSettingsToDocument,
  mergePlatformSettings,
} from "../utils/themeSettings";
import {
  applyUserPreferencesToDocument,
  loadUserPreferences,
} from "../utils/userPreferences";
import { subscribeCodeAcademyRealtime } from "../lib/supabaseRealtime";

interface AuthContextValue {
  user: PublicUser | null;
  categories: CategoryItem[];
  enrolledCourseIds: string[];
  settings: PlatformSettings;
  isAuthLoading: boolean;
  loading: boolean;
  isPasswordRecoveryOpen: boolean;
  closePasswordRecovery: () => void;
  refreshBootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<PublicUser>;
  registerInstructor: (payload: {
    name: string;
    email: string;
    phone?: string;
    specialty: string;
    bio?: string;
    password: string;
  }) => Promise<PublicUser>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPasswordRecoveryOpen, setIsPasswordRecoveryOpen] = useState(false);

  const userRef = useRef<PublicUser | null>(null);
  userRef.current = user;
  const recoveryDismissedRef = useRef(false);

  useEffect(() => {
    applyPlatformSettingsToDocument(settings);
    applyUserPreferencesToDocument(loadUserPreferences());
  }, [settings]);

  const hydrateFromSupabaseUser = useCallback(
    async (authUser: SupabaseAuthUser | null): Promise<PublicUser | null> => {
      if (!authUser) {
        syncSupabaseAuthSessionToLocalStore(null);
        setUser(null);
        setEnrolledCourseIds([]);
        return null;
      }

      let publicUser = mapSupabaseAuthUserToPublicUser(authUser);
      let externalEnrolled: string[] = [];

      // Best-effort profile/enrollment enrichment from public.users without blocking auth
      if (publicUser.email) {
        try {
          const rowRes = await fetchSupabaseUserByEmail(publicUser.email);
          if (rowRes.ok && rowRes.data) {
            externalEnrolled = normalizeEnrolledCourses(
              rowRes.data.enrolled_courses
            );
            const tableRole = normalizeRole(rowRes.data.role);
            publicUser = mapSupabaseAuthUserToPublicUser(authUser, {
              role:
                publicUser.role === "ADMIN"
                  ? "ADMIN"
                  : tableRole !== "STUDENT"
                  ? tableRole
                  : publicUser.role,
            });
          }
        } catch {
          // Non-blocking: Supabase Auth user remains authoritative
        }
      }

      const mergedEnrolled = syncSupabaseAuthSessionToLocalStore(
        publicUser,
        externalEnrolled
      );
      setUser(publicUser);
      setEnrolledCourseIds(mergedEnrolled);
      return publicUser;
    },
    []
  );

  const refreshBootstrap = useCallback(async () => {
    try {
      const data = await apiRequest<{
        categories: CategoryItem[];
        enrolledCourseIds: string[];
        settings?: PlatformSettings;
      }>("/api/bootstrap");
      setCategories(data.categories);
      if (userRef.current && Array.isArray(data.enrolledCourseIds)) {
        setEnrolledCourseIds(data.enrolledCourseIds);
      }
      if (data.settings) {
        setSettings(mergePlatformSettings(data.settings));
      }
    } catch {
      // Keep current catalog/settings state on transient failure
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const recoveryInInitialUrl =
      typeof window !== "undefined" &&
      isPasswordRecoveryUrl(window.location.hash, window.location.search);

    const initAuthAndBootstrap = async () => {
      try {
        const [{ data: sessionData }] = await Promise.all([
          supabase.auth.getSession(),
          refreshBootstrap(),
        ]);

        if (!mounted) return;
        const sessionUser = sessionData?.session?.user ?? null;

        if (sessionUser) {
          await hydrateFromSupabaseUser(sessionUser);
          if (recoveryInInitialUrl && !recoveryDismissedRef.current) {
            setIsPasswordRecoveryOpen(true);
          }
        } else if (!userRef.current) {
          // Only clear state if no user was already hydrated by onAuthStateChange
          await hydrateFromSupabaseUser(null);
        }
      } catch {
        // Never force-logout an already-hydrated session on transient network failure
        if (mounted && !userRef.current) {
          syncSupabaseAuthSessionToLocalStore(null);
          setUser(null);
          setEnrolledCourseIds([]);
        }
      } finally {
        if (mounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void initAuthAndBootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        recoveryDismissedRef.current = false;
        setIsPasswordRecoveryOpen(true);
        if (
          typeof window !== "undefined" &&
          isPasswordRecoveryUrl(window.location.hash, window.location.search)
        ) {
          window.history.replaceState({}, "", window.location.pathname || "/");
        }
      }

      if (event === "SIGNED_OUT") {
        recoveryDismissedRef.current = false;
        syncSupabaseAuthSessionToLocalStore(null);
        setUser(null);
        setEnrolledCourseIds([]);
        setIsPasswordRecoveryOpen(false);
        setIsAuthLoading(false);
        return;
      }

      if (session?.user) {
        if (
          !recoveryDismissedRef.current &&
          event !== "USER_UPDATED" &&
          event !== "TOKEN_REFRESHED" &&
          typeof window !== "undefined" &&
          isPasswordRecoveryUrl(window.location.hash, window.location.search)
        ) {
          setIsPasswordRecoveryOpen(true);
          window.history.replaceState({}, "", window.location.pathname || "/");
        }
        void hydrateFromSupabaseUser(session.user).finally(() => {
          if (mounted) {
            setIsAuthLoading(false);
          }
        });
      }
      // Do NOT clear active session on INITIAL_SESSION/TOKEN_REFRESHED with null
      // to avoid racing getSession() or wiping sessions during navigation/iframe transitions.
    });

    const unsubscribeRealtime = subscribeCodeAcademyRealtime((table) => {
      if (!mounted) return;
      if (
        table === "site_settings" ||
        table === "courses" ||
        table === "course_reviews" ||
        table === "discount_codes" ||
        table === "promo_codes"
      ) {
        void refreshBootstrap();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeRealtime();
    };
  }, [hydrateFromSupabaseUser, refreshBootstrap]);

  const login = useCallback(
    async (email: string, password: string): Promise<PublicUser> => {
      const emailCheck = validateAuthEmail(email);
      if (!emailCheck.valid) {
        throw new Error(emailCheck.error || "فرمت آدرس ایمیل معتبر نیست.");
      }
      if (!password) {
        throw new Error("لطفاً رمز عبور خود را وارد کنید.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailCheck.normalized,
        password,
      });

      if (error || !data.user) {
        throw new Error(translateSupabaseAuthError(error, "login"));
      }

      const hydrated = await hydrateFromSupabaseUser(data.user);
      if (!hydrated) {
        throw new Error("خطا در بارگذاری اطلاعات حساب کاربری.");
      }
      return hydrated;
    },
    [hydrateFromSupabaseUser]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }): Promise<PublicUser> => {
      const fullName = payload.name.trim();
      if (!fullName) {
        throw new Error("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      }
      const emailCheck = validateAuthEmail(payload.email);
      if (!emailCheck.valid) {
        throw new Error(emailCheck.error || "فرمت آدرس ایمیل معتبر نیست.");
      }
      const passCheck = validateAuthPassword(payload.password);
      if (!passCheck.valid) {
        throw new Error(passCheck.error || "رمز عبور باید حداقل ۶ کاراکتر باشد.");
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailCheck.normalized,
        password: payload.password,
        options: {
          data: {
            full_name: fullName,
            ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
          },
        },
      });

      if (error) {
        throw new Error(translateSupabaseAuthError(error, "signup"));
      }

      // Supabase returns empty identities array when email is already registered (anti-enumeration)
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        throw new Error(
          "این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد حساب کاربری خود شوید."
        );
      }

      let activeUser = data.user;

      // Fallback sign-in if session wasn't immediately attached while email confirmation is disabled
      if (activeUser && !data.session) {
        const signInAttempt = await supabase.auth.signInWithPassword({
          email: emailCheck.normalized,
          password: payload.password,
        });
        if (!signInAttempt.error && signInAttempt.data.user) {
          activeUser = signInAttempt.data.user;
        }
      }

      if (!activeUser) {
        throw new Error("ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.");
      }

      // Best-effort profile record sync to public.users (never stores plaintext password)
      try {
        await insertSupabaseUser({
          id: activeUser.id,
          name: fullName,
          email: emailCheck.normalized,
          password: "supabase_auth_managed",
          role: "STUDENT",
          enrolled_courses: [],
          created_at: activeUser.created_at || new Date().toISOString(),
        });
      } catch {
        // Non-blocking if public.users table or RLS differs
      }

      const hydrated = await hydrateFromSupabaseUser(activeUser);
      if (!hydrated) {
        throw new Error("حساب ساخته شد اما بارگذاری پروفایل با خطا مواجه شد.");
      }
      return hydrated;
    },
    [hydrateFromSupabaseUser]
  );

  const registerInstructor = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone?: string;
      specialty: string;
      bio?: string;
      password: string;
    }): Promise<PublicUser> => {
      const fullName = payload.name.trim();
      const specialty = payload.specialty.trim();
      if (!fullName || !specialty) {
        throw new Error("نام و حوزه تخصص برای ثبت‌نام مدرس الزامی است.");
      }
      const emailCheck = validateAuthEmail(payload.email);
      if (!emailCheck.valid) {
        throw new Error(emailCheck.error || "لطفاً ایمیل معتبر وارد کنید.");
      }
      const passCheck = validateAuthPassword(payload.password);
      if (!passCheck.valid) {
        throw new Error(passCheck.error || "رمز عبور باید حداقل ۶ کاراکتر باشد.");
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailCheck.normalized,
        password: payload.password,
        options: {
          data: {
            full_name: fullName,
            phone: payload.phone?.trim() || "",
            specialty,
            bio: payload.bio?.trim() || "",
            instructor_status: "pending",
          },
        },
      });

      if (error) {
        throw new Error(translateSupabaseAuthError(error, "signup"));
      }

      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        throw new Error(
          "این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد حساب کاربری خود شوید."
        );
      }

      let activeUser = data.user;
      if (activeUser && !data.session) {
        const signInAttempt = await supabase.auth.signInWithPassword({
          email: emailCheck.normalized,
          password: payload.password,
        });
        if (!signInAttempt.error && signInAttempt.data.user) {
          activeUser = signInAttempt.data.user;
        }
      }

      if (!activeUser) {
        throw new Error("ثبت درخواست مدرسی انجام نشد. لطفاً دوباره تلاش کنید.");
      }

      try {
        await insertSupabaseUser({
          id: activeUser.id,
          name: fullName,
          email: emailCheck.normalized,
          password: "supabase_auth_managed",
          role: "STUDENT",
          enrolled_courses: [],
          created_at: activeUser.created_at || new Date().toISOString(),
        });
      } catch {
        // Non-blocking
      }

      await recordInstructorApplicationForSupabaseUser({
        userId: activeUser.id,
        name: fullName,
        email: emailCheck.normalized,
        phone: payload.phone,
        specialty,
        bio: payload.bio,
      });

      const hydrated = await hydrateFromSupabaseUser(activeUser);
      if (!hydrated) {
        throw new Error("خطا در بارگذاری اطلاعات حساب مدرس.");
      }
      return hydrated;
    },
    [hydrateFromSupabaseUser]
  );

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const emailCheck = validateAuthEmail(email);
    if (!emailCheck.valid) {
      throw new Error(emailCheck.error || "لطفاً یک آدرس جیمیل یا ایمیل معتبر وارد کنید.");
    }

    const redirectTo =
      typeof window !== "undefined" ? window.location.origin : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(
      emailCheck.normalized,
      {
        redirectTo,
      }
    );

    if (error) {
      throw new Error(translateSupabaseAuthError(error, "recovery"));
    }
  }, []);

  const updateUserPassword = useCallback(
    async (newPassword: string) => {
      const passCheck = validateAuthPassword(newPassword);
      if (!passCheck.valid) {
        throw new Error(passCheck.error || "رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
      }

      recoveryDismissedRef.current = true;
      if (
        typeof window !== "undefined" &&
        isPasswordRecoveryUrl(window.location.hash, window.location.search)
      ) {
        window.history.replaceState({}, "", window.location.pathname || "/");
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(translateSupabaseAuthError(error, "updatePassword"));
      }

      setIsPasswordRecoveryOpen(false);

      if (data.user) {
        await hydrateFromSupabaseUser(data.user);
      }
    },
    [hydrateFromSupabaseUser]
  );

  const closePasswordRecovery = useCallback(() => {
    recoveryDismissedRef.current = true;
    setIsPasswordRecoveryOpen(false);
    if (
      typeof window !== "undefined" &&
      isPasswordRecoveryUrl(window.location.hash, window.location.search)
    ) {
      window.history.replaceState({}, "", window.location.pathname || "/");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Always clear local state even if network fails
    } finally {
      syncSupabaseAuthSessionToLocalStore(null);
      setUser(null);
      setEnrolledCourseIds([]);
      setIsPasswordRecoveryOpen(false);
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
      isAuthLoading,
      loading: isAuthLoading,
      isPasswordRecoveryOpen,
      closePasswordRecovery,
      refreshBootstrap,
      login,
      register,
      registerInstructor,
      sendPasswordResetEmail,
      updateUserPassword,
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
      isAuthLoading,
      isPasswordRecoveryOpen,
      closePasswordRecovery,
      refreshBootstrap,
      login,
      register,
      registerInstructor,
      sendPasswordResetEmail,
      updateUserPassword,
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
