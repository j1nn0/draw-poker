import assert from "node:assert/strict";
import test from "node:test";

import { evaluateHand } from "../src/game.js";

test("scores royal flush highest", () => {
  const result = evaluateHand([
    { rank: "10", suit: "S" },
    { rank: "J", suit: "S" },
    { rank: "Q", suit: "S" },
    { rank: "K", suit: "S" },
    { rank: "A", suit: "S" },
  ]);

  assert.equal(result.name, "Royal Flush");
  assert.equal(result.rank, 9);
});


test("scores Pair for any pair", () => {
  const result = evaluateHand([
    { rank: "J", suit: "S" },
    { rank: "J", suit: "H" },
    { rank: "5", suit: "D" },
    { rank: "9", suit: "C" },
    { rank: "K", suit: "H" },
  ]);

  assert.equal(result.name, "Pair");
  assert.equal(result.rank, 1);
});


test("scores Pair for pair of 10 or lower", () => {
  const result = evaluateHand([
    { rank: "10", suit: "S" },
    { rank: "10", suit: "H" },
    { rank: "5", suit: "D" },
    { rank: "9", suit: "C" },
    { rank: "K", suit: "H" },
  ]);

  assert.equal(result.name, "Pair");
  assert.equal(result.rank, 1);
});
