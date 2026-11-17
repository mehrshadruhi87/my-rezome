import test from "node:test";
import assert from "node:assert/strict";
import {
  toPersianDigits,
  formatToman,
  getLevelInfo,
  generateSlug,
} from "./formatters";

test("toPersianDigits converts ASCII digits to Persian numerals", () => {
  assert.equal(toPersianDigits("1405"), "۱۴۰۵");
  assert.equal(toPersianDigits(3450000), "۳۴۵۰۰۰۰");
  assert.equal(toPersianDigits("ORD-9821"), "ORD-۹۸۲۱");
});

test("formatToman formats currency and zero as free", () => {
  assert.equal(formatToman(0), "رایگان");
  assert.equal(formatToman(-100), "رایگان");
  assert.equal(formatToman(3450000), "۳,۴۵۰,۰۰۰ تومان");
});

test("getLevelInfo maps all course skill levels", () => {
  assert.equal(getLevelInfo("BEGINNER").label, "مقدماتی");
  assert.equal(getLevelInfo("INTERMEDIATE").label, "متوسط");
  assert.equal(getLevelInfo("ADVANCED").label, "پیشرفته");
  assert.equal(getLevelInfo("ALL_LEVELS").label, "مقدماتی تا پیشرفته");
});

test("generateSlug creates clean URL slugs supporting Persian & English", () => {
  assert.equal(generateSlug("Next.js 15 Bootcamp!"), "nextjs-15-bootcamp");
  assert.equal(generateSlug("  دوره جامع پایتون  "), "دوره-جامع-پایتون");
});
