import assert from "node:assert/strict";
import test from "node:test";

import { calculatePayout, getPayTable } from "../src/game.js";

test("calculates payout from pay table", () => {
  assert.equal(calculatePayout("Royal Flush"), 250);
  assert.equal(calculatePayout("Straight Flush"), 50);
  assert.equal(calculatePayout("Four of a Kind"), 25);
  assert.equal(calculatePayout("Full House"), 9);
  assert.equal(calculatePayout("Flush"), 6);
  assert.equal(calculatePayout("Straight"), 4);
  assert.equal(calculatePayout("Three of a Kind"), 3);
  assert.equal(calculatePayout("Two Pair"), 2);
  assert.equal(calculatePayout("Jacks or Better"), 1);
  assert.equal(calculatePayout("High Card"), 0);
});

test("returns 0 for unknown hand names", () => {
  assert.equal(calculatePayout("Unknown Hand"), 0);
  assert.equal(calculatePayout(""), 0);
});

test("pay table has correct per-coin values", () => {
  const table = getPayTable();
  assert.deepEqual(table["Jacks or Better"], [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(table["High Card"], [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(table["Royal Flush"], [0, 250, 500, 750, 1000, 4000]);
});

test("calculatePayout with explicit bet returns correct values", () => {
  assert.equal(calculatePayout("Royal Flush", 5), 4000);
  assert.equal(calculatePayout("Jacks or Better", 3), 3);
  assert.equal(calculatePayout("Two Pair", 4), 8);
  assert.equal(calculatePayout("High Card", 5), 0);
});
