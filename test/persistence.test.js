import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Set environment variable before importing module
const tempDir = mkdtempSync(join(tmpdir(), "draw-poker-test-"));
process.env.DRAW_POKER_DATA_DIR = tempDir;

const { loadCredits, saveCredits, loadHighScores, saveHighScores, loadAchievements, saveAchievements } = await import("../src/persistence.js");

test("loadCredits returns default 100 when file missing", () => {
  const credits = loadCredits();
  assert.equal(credits, 100);
});

test("saveCredits and loadCredits round-trip", () => {
  saveCredits(250);
  const credits = loadCredits();
  assert.equal(credits, 250);
});

test("loadCredits ignores malformed file", () => {
  saveCredits(-5);
  const credits = loadCredits();
  assert.equal(credits, 100);
});

test("loadHighScores returns defaults when file missing", () => {
  const scores = loadHighScores();
  assert.equal(scores.maxCredits, 0);
  assert.equal(scores.bestHandRank, 0);
  assert.equal(scores.bestHandName, "N/A");
  assert.equal(scores.maxDoubleUps, 0);
});

test("saveHighScores and loadHighScores round-trip", () => {
  const scores = {
    maxCredits: 500,
    bestHandRank: 9,
    bestHandName: "Royal Flush",
    maxDoubleUps: 3,
    totalGamesPlayed: 10,
    totalGamesWon: 4,
    totalBet: 100,
    totalPayout: 250,
  };
  saveHighScores(scores);
  const loaded = loadHighScores();
  assert.deepEqual(loaded, scores);
});

test("loadAchievements returns defaults when file missing", () => {
  const data = loadAchievements();
  assert.deepEqual(data, { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 });
});

test("saveAchievements and loadAchievements round-trip", () => {
  const state = {
    unlocked: { first_pair: "2026-06-16T00:00:00.000Z" },
    handTypesAchieved: ["Pair", "Flush"],
    totalDoubleUps: 5,
  };
  saveAchievements(state);
  const loaded = loadAchievements();
  assert.deepEqual(loaded, state);
});

test("loadAchievements ignores corrupted top-level JSON", () => {
  // Top-level is not an object: null, array, string
  for (const content of ["null", "[]", '"hello"', "42"]) {
    writeFileSync(join(tempDir, "achievements.json"), content);
    const data = loadAchievements();
    assert.deepEqual(data, { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 });
  }
});

test("loadAchievements filters invalid unlocked and handTypesAchieved entries", () => {
  writeFileSync(
    join(tempDir, "achievements.json"),
    JSON.stringify({
      unlocked: { good: "2026-01-01T00:00:00.000Z", bad: 123, bad2: null },
      handTypesAchieved: ["Pair", 123, null, "Flush"],
      totalDoubleUps: 5,
    }),
  );
  const data = loadAchievements();
  assert.deepEqual(data.unlocked, { good: "2026-01-01T00:00:00.000Z" });
  assert.deepEqual(data.handTypesAchieved, ["Pair", "Flush"]);
  assert.equal(data.totalDoubleUps, 5);
});

test("loadAchievements normalizes invalid totalDoubleUps", () => {
  for (const [raw, expected] of [
    ["10", 0],
    [-5, 0],
    [5.9, 5],
    [null, 0],
  ]) {
    writeFileSync(
      join(tempDir, "achievements.json"),
      JSON.stringify({ unlocked: {}, handTypesAchieved: [], totalDoubleUps: raw }),
    );
    const data = loadAchievements();
    assert.equal(data.totalDoubleUps, expected, `raw=${JSON.stringify(raw)}`);
  }
});

test("loadAchievements tolerates malformed JSON and missing fields", () => {
  writeFileSync(join(tempDir, "achievements.json"), "{not json");
  assert.deepEqual(loadAchievements(), { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 });

  writeFileSync(join(tempDir, "achievements.json"), JSON.stringify({}));
  assert.deepEqual(loadAchievements(), { unlocked: {}, handTypesAchieved: [], totalDoubleUps: 0 });

  // unlocked as string should not pollute Map (previous bug would create numeric keys)
  writeFileSync(join(tempDir, "achievements.json"), JSON.stringify({ unlocked: "oops", handTypesAchieved: ["Pair"], totalDoubleUps: 1 }));
  const data = loadAchievements();
  assert.deepEqual(data.unlocked, {});
  assert.deepEqual(data.handTypesAchieved, ["Pair"]);
});

after(() => {
  rmSync(tempDir, { recursive: true });
});
