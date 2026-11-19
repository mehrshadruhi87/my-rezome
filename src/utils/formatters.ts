import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "۰";
  return num
    .toString()
    .replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)] ?? digit);
}

export function formatToman(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "رایگان";
  }
  const formatted = Math.round(amount).toLocaleString("en-US");
  return `${toPersianDigits(formatted)} تومان`;
}

export function getLevelInfo(level: string): { label: string; textClass: string } {
  switch (level) {
    case "BEGINNER":
      return { label: "مقدماتی", textClass: "text-emerald-400" };
    case "INTERMEDIATE":
      return { label: "متوسط", textClass: "text-amber-400" };
    case "ADVANCED":
      return { label: "پیشرفته", textClass: "text-rose-400" };
    default:
      return { label: "مقدماتی تا پیشرفته", textClass: "text-indigo-400" };
  }
}

export function generateSlug(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function formatPersianDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return toPersianDigits(isoString.slice(0, 10));
  }
}
