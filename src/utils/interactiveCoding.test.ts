import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_CHALLENGES,
  DEFAULT_CHALLENGE_PROGRESS,
  INTERACTIVE_ROADMAPS,
  PLAYGROUND_TEMPLATES,
  applyChallengeWin,
  computeTrackProgress,
  evaluateChallengeSubmission,
  getRankInfo,
  runSandboxCode,
} from "./interactiveCoding";

test("runSandboxCode captures console logs and return value", () => {
  const res = runSandboxCode(`
    const nums = [1, 2, 3];
    console.log("sum:", nums.reduce((a, b) => a + b, 0));
    return nums.length;
  `);

  assert.equal(res.ok, true);
  assert.equal(res.logs.length, 1);
  assert.equal(res.logs[0].text, "sum: 6");
  assert.equal(res.returnValue, "3");
});

test("runSandboxCode handles runtime errors safely", () => {
  const res = runSandboxCode(`throw new Error("boom");`);
  assert.equal(res.ok, false);
  assert.match(res.error ?? "", /boom/);
});

test("all built-in playground templates execute without error", () => {
  for (const tpl of PLAYGROUND_TEMPLATES) {
    const res = runSandboxCode(tpl.code);
    assert.equal(res.ok, true, `Template ${tpl.id} failed: ${res.error}`);
    assert.ok(res.logs.length > 0, `Template ${tpl.id} produced no logs`);
  }
});

test("evaluateChallengeSubmission passes all reference solutions and fails wrong ones", () => {
  for (const challenge of DAILY_CHALLENGES) {
    const passResult = evaluateChallengeSubmission(
      challenge,
      challenge.solutionCode
    );
    assert.equal(
      passResult.allPassed,
      true,
      `Solution for ${challenge.id} should pass all tests`
    );
    assert.equal(passResult.passedCount, challenge.testCases.length);
  }

  const first = DAILY_CHALLENGES[0];
  const failResult = evaluateChallengeSubmission(
    first,
    `function sumEvens() { return -1; }`
  );
  assert.equal(failResult.allPassed, false);
  assert.equal(failResult.passedCount, 0);
});

test("applyChallengeWin awards XP only once per challenge and updates rank", () => {
  const challenge = DAILY_CHALLENGES[0];
  const firstWin = applyChallengeWin(
    DEFAULT_CHALLENGE_PROGRESS,
    challenge,
    "2026-04-15"
  );
  assert.equal(firstWin.newlySolved, true);
  assert.equal(firstWin.next.xp, challenge.xp);

  const duplicateWin = applyChallengeWin(firstWin.next, challenge, "2026-04-15");
  assert.equal(duplicateWin.newlySolved, false);
  assert.equal(duplicateWin.next.xp, challenge.xp);

  assert.equal(getRankInfo(0).title, "نوآموز کدنویسی");
  assert.equal(getRankInfo(260).title, "کدنویس سایبری");
  assert.equal(getRankInfo(540).title, "مهندس ارشد");
  assert.equal(getRankInfo(900).title, "معمار کهکشانی");
});

test("computeTrackProgress calculates milestone completion percentage accurately", () => {
  const track = INTERACTIVE_ROADMAPS[0];
  const res = computeTrackProgress(track, [track.milestones[0].id, track.milestones[1].id]);
  assert.equal(res.completed, 2);
  assert.equal(res.total, 4);
  assert.equal(res.percent, 50);
});
