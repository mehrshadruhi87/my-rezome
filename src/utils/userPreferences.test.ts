import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCENT_THEMES,
  DEFAULT_USER_PREFERENCES,
  USER_PREFS_STORAGE_KEY,
  getMotionConfigValues,
  loadUserPreferences,
  sanitizeUserPreferences,
  saveUserPreferences,
} from "./userPreferences";

test("sanitizeUserPreferences falls back safely on invalid values", () => {
  const result = sanitizeUserPreferences({
    mode: "invalid" as never,
    accent: "unknown" as never,
    fontSize: 99,
    motionSpeed: "turbo" as never,
  });

  assert.equal(result.mode, "dark");
  assert.equal(result.accent, "galaxy_blue");
  assert.equal(result.fontSize, 19);
  assert.equal(result.motionSpeed, "normal");
});

test("sanitizeUserPreferences clamps font size lower bound and preserves valid options", () => {
  const result = sanitizeUserPreferences({
    mode: "light",
    accent: "cyber_orange",
    fontSize: 10,
    motionSpeed: "fast",
  });

  assert.deepEqual(result, {
    mode: "light",
    accent: "cyber_orange",
    fontSize: 14,
    motionSpeed: "fast",
    language: "fa",
  });
});

test("saveUserPreferences and loadUserPreferences round-trip through storage", () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };

  saveUserPreferences(
    {
      mode: "light",
      accent: "emerald_green",
      fontSize: 18,
      motionSpeed: "slow",
      language: "en",
    },
    mockStorage
  );

  assert.ok(store.has(USER_PREFS_STORAGE_KEY));
  const loaded = loadUserPreferences(mockStorage);
  assert.deepEqual(loaded, {
    mode: "light",
    accent: "emerald_green",
    fontSize: 18,
    motionSpeed: "slow",
    language: "en",
  });
});

test("loadUserPreferences handles malformed JSON gracefully", () => {
  const mockStorage = {
    getItem: () => "{broken json",
  };
  const loaded = loadUserPreferences(mockStorage);
  assert.deepEqual(loaded, DEFAULT_USER_PREFERENCES);
});

test("accent themes and motion configs expose all required options", () => {
  assert.ok(ACCENT_THEMES.galaxy_blue.cssVars["--accent-500"]);
  assert.ok(ACCENT_THEMES.emerald_green.cssVars["--accent-500"]);
  assert.ok(ACCENT_THEMES.cyber_orange.cssVars["--accent-500"]);
  assert.equal(getMotionConfigValues("off").durationMultiplier, 0);
  assert.equal(getMotionConfigValues("fast").particleSpeed, 1.75);
});
