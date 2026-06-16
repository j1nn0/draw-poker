import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
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

after(() => {
  rmSync(tempDir, { recursive: true });
});
