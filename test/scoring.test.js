import assert from "node:assert/strict";
import test from "node:test";
import { accumulateStats, updateHighScores } from "../src/scoring.js";

test("updateHighScores updates maxCredits when higher", () => {
  const current = { maxCredits: 100, bestHandRank: 5, bestHandName: "Flush", maxDoubleUps: 2 };
  const session = { maxCreditReached: 200, bestHandRank: 4, bestHandName: "Straight", maxDoubleUps: 1 };
  const updated = updateHighScores(current, session);

  assert.equal(updated.maxCredits, 200);
  assert.equal(updated.bestHandRank, 5);
  assert.equal(updated.bestHandName, "Flush");
  assert.equal(updated.maxDoubleUps, 2);
});

test("updateHighScores keeps existing bestHandRank when higher", () => {
  const current = { maxCredits: 100, bestHandRank: 9, bestHandName: "Royal Flush", maxDoubleUps: 2 };
  const session = { maxCreditReached: 200, bestHandRank: 8, bestHandName: "Straight Flush", maxDoubleUps: 3 };
  const updated = updateHighScores(current, session);

  assert.equal(updated.maxCredits, 200);
  assert.equal(updated.bestHandRank, 9);
  assert.equal(updated.bestHandName, "Royal Flush");
  assert.equal(updated.maxDoubleUps, 3);
});

test("updateHighScores updates bestHandName when rank improves", () => {
  const current = { maxCredits: 100, bestHandRank: 5, bestHandName: "Flush", maxDoubleUps: 2 };
  const session = { maxCreditReached: 50, bestHandRank: 7, bestHandName: "Four of a Kind", maxDoubleUps: 1 };
  const updated = updateHighScores(current, session);

  assert.equal(updated.maxCredits, 100);
  assert.equal(updated.bestHandRank, 7);
  assert.equal(updated.bestHandName, "Four of a Kind");
  assert.equal(updated.maxDoubleUps, 2);
});

test("updateHighScores updates all fields when session exceeds", () => {
  const current = { maxCredits: 100, bestHandRank: 5, bestHandName: "Flush", maxDoubleUps: 2 };
  const session = { maxCreditReached: 200, bestHandRank: 9, bestHandName: "Royal Flush", maxDoubleUps: 5 };
  const updated = updateHighScores(current, session);

  assert.equal(updated.maxCredits, 200);
  assert.equal(updated.bestHandRank, 9);
  assert.equal(updated.bestHandName, "Royal Flush");
  assert.equal(updated.maxDoubleUps, 5);
});

test("accumulateStats adds session values to running totals", () => {
  const current = { totalGamesPlayed: 50, totalGamesWon: 20, totalBet: 500, totalPayout: 800 };
  const session = { gamesPlayed: 10, gamesWon: 3, totalBet: 100, totalPayout: 200 };
  const updated = accumulateStats(current, session);

  assert.equal(updated.totalGamesPlayed, 60);
  assert.equal(updated.totalGamesWon, 23);
  assert.equal(updated.totalBet, 600);
  assert.equal(updated.totalPayout, 1000);
});

test("accumulateStats works with empty session defaults", () => {
  const current = { totalGamesPlayed: 5, totalGamesWon: 2, totalBet: 50, totalPayout: 100 };
  const updated = accumulateStats(current, {});

  assert.equal(updated.totalGamesPlayed, 5);
  assert.equal(updated.totalGamesWon, 2);
  assert.equal(updated.totalBet, 50);
  assert.equal(updated.totalPayout, 100);
});
