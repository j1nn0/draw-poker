import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Set environment variable before importing module
const tempDir = mkdtempSync(join(tmpdir(), "draw-poker-test-"));
process.env.DRAW_POKER_DATA_DIR = tempDir;

const { loadCredits, saveCredits, loadHighScores, saveHighScores } = await import("../src/persistence.js");

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

after(() => {
  rmSync(tempDir, { recursive: true });
});
