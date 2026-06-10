import assert from "node:assert/strict";
import test from "node:test";

import { evaluateHand, formatVisualHand, parseHoldInput } from "../src/game.js";

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

test("rejects malformed hold input", () => {
  assert.throws(() => parseHoldInput("1 2 6 x"), /Hold choices must be card numbers from 1 to 5/);
});

test("parses empty hold input as no held cards", () => {
  assert.deepEqual(parseHoldInput(""), new Set());
});

test("formats visual hand with selected and exchange states", () => {
  const output = formatVisualHand(
    [
      { rank: "A", suit: "S" },
      { rank: "10", suit: "C" },
    ],
    1,
    new Set([0]),
  );

  assert.match(output, /A♠/);
  assert.match(output, /10♣/);
  assert.match(output, /\|  S  \|/);
  assert.match(output, /\|  C  \|/);
  assert.match(output, /CHANGE\s+KEEP/);
  assert.match(output.split("\n")[0], /v/);
});
