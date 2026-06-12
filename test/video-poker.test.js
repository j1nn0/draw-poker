import assert from "node:assert/strict";
import test from "node:test";

import { calculatePayout, getPayTable } from "../src/game.js";

test("calculates payout from pay table", () => {
  assert.equal(calculatePayout("Royal Flush"), 500);
  assert.equal(calculatePayout("Straight Flush"), 100);
  assert.equal(calculatePayout("Four of a Kind"), 50);
  assert.equal(calculatePayout("Full House"), 10);
  assert.equal(calculatePayout("Flush"), 7);
  assert.equal(calculatePayout("Straight"), 5);
  assert.equal(calculatePayout("Three of a Kind"), 3);
  assert.equal(calculatePayout("Two Pair"), 2);
  assert.equal(calculatePayout("Pair"), 1);
  assert.equal(calculatePayout("High Card"), 0);
});

test("returns 0 for unknown hand names", () => {
  assert.equal(calculatePayout("Unknown Hand"), 0);
  assert.equal(calculatePayout(""), 0);
});

test("pay table has correct per-coin values", () => {
  const table = getPayTable();
  assert.deepEqual(table["Pair"], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(table["High Card"], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(table["Royal Flush"], [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 8000]);
});

test("calculatePayout with explicit bet returns correct values", () => {
  assert.equal(calculatePayout("Royal Flush", 5), 2500);
  assert.equal(calculatePayout("Pair", 3), 3);
  assert.equal(calculatePayout("Two Pair", 4), 8);
  assert.equal(calculatePayout("High Card", 5), 0);
});
