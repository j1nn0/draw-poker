import assert from "node:assert/strict";
import { accumulateStats, detectNewRecords, mergeSessionResults, updateHighScores } from "../src/scoring.js";
import test from "node:test";

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

test("mergeSessionResults combines peak records and cumulative stats", () => {
  const highScores = {
    maxCredits: 100, bestHandRank: 5, bestHandName: "Flush", maxDoubleUps: 2,
    totalGamesPlayed: 50, totalGamesWon: 20, totalBet: 500, totalPayout: 800,
  };
  const session = {
    maxCreditReached: 200, bestHandRank: 7, bestHandName: "Four of a Kind", maxDoubleUps: 3,
    gamesPlayed: 10, gamesWon: 3, totalBet: 100, totalPayout: 200,
  };
  const result = mergeSessionResults(highScores, session);
  assert.equal(result.maxCredits, 200);
  assert.equal(result.bestHandRank, 7);
  assert.equal(result.bestHandName, "Four of a Kind");
  assert.equal(result.maxDoubleUps, 3);
  assert.equal(result.totalGamesPlayed, 60);
  assert.equal(result.totalGamesWon, 23);
  assert.equal(result.totalBet, 600);
  assert.equal(result.totalPayout, 1000);
});

test("detectNewRecords detects maxCredits record", () => {
  const updated = { maxCredits: 500, bestHandRank: 5, maxDoubleUps: 2 };
  const previous = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const session = { maxCreditReached: 500, bestHandRank: 5, maxDoubleUps: 2 };
  const records = detectNewRecords(updated, previous, session);
  assert.deepEqual(records, ["最高コイン"]);
});

test("detectNewRecords detects bestHandRank record", () => {
  const updated = { maxCredits: 100, bestHandRank: 9, maxDoubleUps: 2 };
  const previous = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const session = { maxCreditReached: 100, bestHandRank: 9, maxDoubleUps: 2 };
  const records = detectNewRecords(updated, previous, session);
  assert.deepEqual(records, ["最高役"]);
});

test("detectNewRecords detects maxDoubleUps record", () => {
  const updated = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 5 };
  const previous = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const session = { maxCreditReached: 100, bestHandRank: 5, maxDoubleUps: 5 };
  const records = detectNewRecords(updated, previous, session);
  assert.deepEqual(records, ["最大ダブルアップ"]);
});

test("detectNewRecords detects multiple records", () => {
  const updated = { maxCredits: 500, bestHandRank: 9, maxDoubleUps: 5 };
  const previous = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const session = { maxCreditReached: 500, bestHandRank: 9, maxDoubleUps: 5 };
  const records = detectNewRecords(updated, previous, session);
  assert.deepEqual(records, ["最高コイン", "最高役", "最大ダブルアップ"]);
});

test("detectNewRecords returns empty array when no records broken", () => {
  const updated = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const previous = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const session = { maxCreditReached: 50, bestHandRank: 3, maxDoubleUps: 1 };
  const records = detectNewRecords(updated, previous, session);
  assert.deepEqual(records, []);
});

test("detectNewRecords does not flag when session value matches existing record but doesn't exceed it", () => {
  const updated = { maxCredits: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const previous = { maxCredits: 200, bestHandRank: 9, maxDoubleUps: 5 };
  const session = { maxCreditReached: 100, bestHandRank: 5, maxDoubleUps: 2 };
  const records = detectNewRecords(updated, previous, session);
  assert.deepEqual(records, []);
});
