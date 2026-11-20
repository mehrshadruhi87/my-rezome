import test from "node:test";
import assert from "node:assert/strict";
import { computeCourseRatingStats } from "./courseReviews";
import {
  MARQUEE_ITEMS_BY_LANG,
  localizeCategory,
  localizeChallenge,
  localizeCourseSummary,
  localizeHtmlCssTemplate,
  localizeNewsArticle,
  localizePlaygroundTemplate,
  localizeRankInfo,
  localizeRoadmapTrack,
} from "./contentLocalization";
import { CODEACADEMY_FULL_SUPABASE_SQL } from "./supabaseAdminSync";
import {
  DAILY_CHALLENGES,
  HTML_CSS_TEMPLATES,
  INTERACTIVE_ROADMAPS,
  PLAYGROUND_TEMPLATES,
  getRankInfo,
} from "../utils/interactiveCoding";
import type { CourseSummary, NewsArticle, ReviewItem } from "../types";

const PERSIAN_CHAR_RE = /[\u0600-\u06FF]/;

test("computeCourseRatingStats returns null average and 0 count when no reviews exist", () => {
  const stats = computeCourseRatingStats([], "crs_1");
  assert.equal(stats.averageRating, null);
  assert.equal(stats.reviewCount, 0);
});

test("computeCourseRatingStats averages approved ratings to 1 decimal and ignores REJECTED", () => {
  const reviews: ReviewItem[] = [
    {
      id: "r1",
      courseId: "crs_1",
      userId: "u1",
      userName: "Ali",
      rating: 5,
      comment: "Great",
      status: "APPROVED",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "r2",
      courseId: "crs_1",
      userId: "u2",
      userName: "Sara",
      rating: 4,
      comment: "Good",
      status: "APPROVED",
      createdAt: "2026-01-02T00:00:00Z",
    },
    {
      id: "r3",
      courseId: "crs_1",
      userId: "u3",
      userName: "Spam",
      rating: 1,
      comment: "Bad",
      status: "REJECTED",
      createdAt: "2026-01-03T00:00:00Z",
    },
  ];
  const stats = computeCourseRatingStats(reviews, "crs_1");
  assert.equal(stats.reviewCount, 2);
  assert.equal(stats.averageRating, 4.5);
});

test("EN localization produces zero Persian characters across courses, categories, news, roadmaps, lab, challenges & marquee", () => {
  const sampleCourse: CourseSummary = {
    id: "crs_nextjs_15",
    title: "بوت‌کمپ جامع Next.js 15",
    slug: "nextjs-15-fullstack-bootcamp",
    shortDesc: "آموزش پروژه‌محور",
    thumbnail: "/thumb.jpg",
    instructorName: "دکتر کیوان نادری",
    instructorTitle: "معمار ارشد",
    price: 4900000,
    discountPrice: 3450000,
    level: "ALL_LEVELS",
    duration: "۶۴ ساعت",
    studentsCount: 1240,
    rating: 5,
    reviewCount: 1,
    isFeatured: true,
    isPublished: true,
    categoryId: "cat_fe",
    createdAt: "2026-01-01T00:00:00Z",
    category: {
      id: "cat_fe",
      name: "فرانت‌اند",
      slug: "frontend",
    },
  };

  const enCourse = localizeCourseSummary(sampleCourse, "en");
  assert.equal(PERSIAN_CHAR_RE.test(enCourse.title), false);
  assert.equal(PERSIAN_CHAR_RE.test(enCourse.shortDesc), false);
  assert.equal(PERSIAN_CHAR_RE.test(enCourse.instructorName), false);
  assert.equal(PERSIAN_CHAR_RE.test(enCourse.duration), false);
  assert.equal(PERSIAN_CHAR_RE.test(enCourse.category.name), false);

  const enCat = localizeCategory(
    {
      id: "cat_ai",
      slug: "ai-data",
      name: "هوش مصنوعی",
      description: "یادگیری ماشین",
      icon: "BrainCircuit",
    },
    "en"
  );
  assert.equal(PERSIAN_CHAR_RE.test(enCat.name), false);
  assert.equal(PERSIAN_CHAR_RE.test(enCat.description || ""), false);

  const sampleNews: NewsArticle = {
    id: "n1",
    slug: "typescript-compiler-speed-upgrade",
    title: "انتشار نسخه جدید تایپ‌اسکریپت",
    summary: "خلاصه خبر",
    content: "متن خبر",
    category: "توسعه وب",
    authorName: "تحریریه کدآکادمی",
    imageUrl: "",
    createdAt: "2026-03-01T10:00:00Z",
    isPublished: true,
  };
  const enNews = localizeNewsArticle(sampleNews, "en");
  assert.equal(PERSIAN_CHAR_RE.test(enNews.title), false);
  assert.equal(PERSIAN_CHAR_RE.test(enNews.summary), false);
  assert.equal(PERSIAN_CHAR_RE.test(enNews.category), false);
  assert.equal(PERSIAN_CHAR_RE.test(enNews.authorName), false);

  for (const track of INTERACTIVE_ROADMAPS) {
    const enTrack = localizeRoadmapTrack(track, "en");
    assert.equal(PERSIAN_CHAR_RE.test(enTrack.title), false, track.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTrack.subtitle), false, track.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTrack.duration), false, track.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTrack.level), false, track.id);
    for (const ms of enTrack.milestones) {
      assert.equal(PERSIAN_CHAR_RE.test(ms.title), false, ms.id);
      assert.equal(PERSIAN_CHAR_RE.test(ms.summary), false, ms.id);
      assert.equal(PERSIAN_CHAR_RE.test(ms.capstone), false, ms.id);
    }
  }

  for (const tpl of PLAYGROUND_TEMPLATES) {
    const enTpl = localizePlaygroundTemplate(tpl, "en");
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.title), false, tpl.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.badge), false, tpl.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.description), false, tpl.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.code), false, tpl.id);
  }

  for (const tpl of HTML_CSS_TEMPLATES) {
    const enTpl = localizeHtmlCssTemplate(tpl, "en");
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.title), false, tpl.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.badge), false, tpl.id);
    assert.equal(PERSIAN_CHAR_RE.test(enTpl.description), false, tpl.id);
  }

  for (const ch of DAILY_CHALLENGES) {
    const enCh = localizeChallenge(ch, "en");
    assert.equal(PERSIAN_CHAR_RE.test(enCh.title), false, ch.id);
    assert.equal(PERSIAN_CHAR_RE.test(enCh.category), false, ch.id);
    assert.equal(PERSIAN_CHAR_RE.test(enCh.description), false, ch.id);
    assert.equal(PERSIAN_CHAR_RE.test(enCh.starterCode), false, ch.id);
    assert.equal(PERSIAN_CHAR_RE.test(enCh.displayDifficulty), false, ch.id);
  }

  const enRank = localizeRankInfo(getRankInfo(0), "en");
  assert.equal(PERSIAN_CHAR_RE.test(enRank.title), false);
  assert.equal(PERSIAN_CHAR_RE.test(enRank.nextRankTitle), false);

  for (const item of MARQUEE_ITEMS_BY_LANG.en) {
    assert.equal(PERSIAN_CHAR_RE.test(item), false);
  }
});

test("CODEACADEMY_FULL_SUPABASE_SQL includes course_reviews, learning_paths, promo_codes, RLS and Realtime", () => {
  assert.match(CODEACADEMY_FULL_SUPABASE_SQL, /create table if not exists public\.course_reviews/i);
  assert.match(CODEACADEMY_FULL_SUPABASE_SQL, /create table if not exists public\.learning_paths/i);
  assert.match(CODEACADEMY_FULL_SUPABASE_SQL, /create table if not exists public\.promo_codes/i);
  assert.match(CODEACADEMY_FULL_SUPABASE_SQL, /supabase_realtime/i);
  assert.match(CODEACADEMY_FULL_SUPABASE_SQL, /enable row level security/i);
});
