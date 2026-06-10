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

test("pay table has correct values for Jacks or Better", () => {
  const table = getPayTable();
  assert.equal(table["Jacks or Better"], 1);
  assert.equal(table["High Card"], 0);
  assert.equal(table["Royal Flush"], 250);
});
