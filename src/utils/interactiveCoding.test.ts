import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHtmlCssPreviewDoc,
  DAILY_CHALLENGES,
  evaluateChallengeSubmission,
  getDailyChallengesForDate,
  getTodayDateKey,
  HTML_CSS_TEMPLATES,
  INTERACTIVE_ROADMAPS,
} from "./interactiveCoding";

test("buildHtmlCssPreviewDoc embeds HTML and CSS cleanly with RTL document structure", () => {
  const doc = buildHtmlCssPreviewDoc("<h1>سلام</h1>", "h1 { color: red; }");
  assert.match(doc, /dir="rtl"/);
  assert.match(doc, /<h1>سلام<\/h1>/);
  assert.match(doc, /h1 \{ color: red; \}/);
  assert.ok(HTML_CSS_TEMPLATES.length >= 2);
});

test("DAILY_CHALLENGES has at least 10 challenges and all reference solutions pass", () => {
  assert.ok(DAILY_CHALLENGES.length >= 10);
  for (const ch of DAILY_CHALLENGES) {
    const res = evaluateChallengeSubmission(ch, ch.solutionCode);
    assert.equal(
      res.allPassed,
      true,
      `Challenge ${ch.id} reference solution failed: ${res.runtimeError || ""}`
    );
  }
});

test("getDailyChallengesForDate rotates challenges deterministically across dates", () => {
  const day1 = getDailyChallengesForDate("2025-05-01", 3);
  const day2 = getDailyChallengesForDate("2025-05-02", 3);
  const day1Repeat = getDailyChallengesForDate("2025-05-01", 3);

  assert.equal(day1.length, 3);
  assert.deepEqual(
    day1.map((c) => c.id),
    day1Repeat.map((c) => c.id)
  );
  assert.notDeepEqual(
    day1.map((c) => c.id),
    day2.map((c) => c.id)
  );
  assert.match(getTodayDateKey(), /^\d{4}-\d{2}-\d{2}$/);
});

test("INTERACTIVE_ROADMAPS milestones include prerequisites and recommendedCourses", () => {
  assert.ok(INTERACTIVE_ROADMAPS.length >= 3);
  for (const rm of INTERACTIVE_ROADMAPS) {
    for (const ms of rm.milestones) {
      assert.ok(
        ms.prerequisites.length > 0,
        `Missing prerequisites in ${ms.id}`
      );
      assert.ok(
        ms.recommendedCourses.length > 0,
        `Missing recommendedCourses in ${ms.id}`
      );
    }
  }
});
