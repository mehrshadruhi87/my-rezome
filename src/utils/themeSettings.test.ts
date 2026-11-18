import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PLATFORM_SETTINGS,
  SITE_FONTS,
  THEME_PALETTES,
  getSiteFont,
  getThemePalette,
  mergePlatformSettings,
} from "./themeSettings";

test("provides 5 distinct theme palettes and 5 Persian font families", () => {
  assert.equal(THEME_PALETTES.length, 5);
  assert.equal(SITE_FONTS.length, 5);

  const ids = new Set(THEME_PALETTES.map((p) => p.id));
  assert.equal(ids.size, 5);
  for (const palette of THEME_PALETTES) {
    assert.equal(palette.swatches.length, 5);
    assert.ok(palette.cssVars["--color-indigo-600"].startsWith("#"));
    assert.ok(palette.cssVars["--site-bg"].startsWith("#"));
  }
});

test("mergePlatformSettings clamps bounds and falls back on invalid values", () => {
  const merged = mergePlatformSettings({
    themePalette: "emerald_obsidian",
    fontFamily: "rubik",
    baseFontSize: 28,
    headingScale: 0.2,
    lineHeight: 5,
    featuredCoursesLimit: 1,
    brandPrimaryText: "   ",
    allowCoupons: false,
  });

  assert.equal(merged.themePalette, "emerald_obsidian");
  assert.equal(merged.fontFamily, "rubik");
  assert.equal(merged.baseFontSize, 18);
  assert.equal(merged.headingScale, 0.9);
  assert.equal(merged.lineHeight, 1.95);
  assert.equal(merged.featuredCoursesLimit, 3);
  assert.equal(
    merged.brandPrimaryText,
    DEFAULT_PLATFORM_SETTINGS.brandPrimaryText
  );
  assert.equal(merged.allowCoupons, false);

  const fallback = mergePlatformSettings({
    // @ts-expect-error testing invalid runtime values
    themePalette: "non_existent",
    // @ts-expect-error testing invalid runtime values
    fontFamily: "unknown_font",
  });
  assert.equal(fallback.themePalette, DEFAULT_PLATFORM_SETTINGS.themePalette);
  assert.equal(fallback.fontFamily, DEFAULT_PLATFORM_SETTINGS.fontFamily);
});

test("getThemePalette and getSiteFont resolve matching definitions", () => {
  assert.equal(getThemePalette("cyan_ocean").id, "cyan_ocean");
  assert.equal(getSiteFont("readex_pro").id, "readex_pro");
});
