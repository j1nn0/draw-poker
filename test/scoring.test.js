import assert from "node:assert/strict";
import test from "node:test";
import { updateHighScores } from "../src/scoring.js";

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
