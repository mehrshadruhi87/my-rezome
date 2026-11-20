import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MotionConfig } from "motion/react";
import { useAuth } from "./AuthContext";
import {
  DEFAULT_USER_PREFERENCES,
  type AccentThemeId,
  type MotionSpeedId,
  type SiteLanguage,
  type ThemeMode,
  type UserPreferences,
  applyUserPreferencesToDocument,
  getMotionConfigValues,
  loadUserPreferences,
  saveUserPreferences,
} from "../utils/userPreferences";

interface UserPreferencesContextValue {
  prefs: UserPreferences;
  language: SiteLanguage;
  isRtl: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setLanguage: (language: SiteLanguage) => void;
  toggleLanguage: () => void;
  setAccent: (accent: AccentThemeId) => void;
  setFontSize: (fontSize: number) => void;
  setMotionSpeed: (speed: MotionSpeedId) => void;
  resetPreferences: () => void;
  motionDuration: (baseSeconds: number) => number;
  particleSpeed: number;
  isReducedMotion: boolean;
}

const UserPreferencesContext =
  createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(() =>
    loadUserPreferences()
  );

  // Re-apply user preferences whenever they change OR after platform settings apply
  useEffect(() => {
    applyUserPreferencesToDocument(prefs);
    saveUserPreferences(prefs);
  }, [prefs, settings]);

  const setMode = useCallback((mode: ThemeMode) => {
    setPrefs((prev) => ({ ...prev, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      mode: prev.mode === "dark" ? "light" : "dark",
    }));
  }, []);

  const setLanguage = useCallback((language: SiteLanguage) => {
    setPrefs((prev) => ({ ...prev, language }));
  }, []);

  const toggleLanguage = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      language: prev.language === "fa" ? "en" : "fa",
    }));
  }, []);

  const setAccent = useCallback((accent: AccentThemeId) => {
    setPrefs((prev) => ({ ...prev, accent }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    const clamped = Math.min(19, Math.max(14, Math.round(fontSize)));
    setPrefs((prev) => ({ ...prev, fontSize: clamped }));
  }, []);

  const setMotionSpeed = useCallback((motionSpeed: MotionSpeedId) => {
    setPrefs((prev) => ({ ...prev, motionSpeed }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPrefs({ ...DEFAULT_USER_PREFERENCES });
  }, []);

  const motionMeta = getMotionConfigValues(prefs.motionSpeed);
  const isReducedMotion = prefs.motionSpeed === "off";
  const language: SiteLanguage = prefs.language === "en" ? "en" : "fa";
  const isRtl = language === "fa";

  const motionDuration = useCallback(
    (baseSeconds: number) => {
      if (motionMeta.durationMultiplier === 0) return 0;
      return Number((baseSeconds * motionMeta.durationMultiplier).toFixed(3));
    },
    [motionMeta.durationMultiplier]
  );

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      prefs,
      language,
      isRtl,
      setMode,
      toggleMode,
      setLanguage,
      toggleLanguage,
      setAccent,
      setFontSize,
      setMotionSpeed,
      resetPreferences,
      motionDuration,
      particleSpeed: motionMeta.particleSpeed,
      isReducedMotion,
    }),
    [
      prefs,
      language,
      isRtl,
      setMode,
      toggleMode,
      setLanguage,
      toggleLanguage,
      setAccent,
      setFontSize,
      setMotionSpeed,
      resetPreferences,
      motionDuration,
      motionMeta.particleSpeed,
      isReducedMotion,
    ]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      <MotionConfig reducedMotion={isReducedMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    );
  }
  return ctx;
}
