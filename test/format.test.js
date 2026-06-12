import { strict as assert } from "node:assert/strict";
import { test } from "node:test";

import { formatHand, formatVisualHand } from "../src/game.js";

test("formatHand returns exact numbered card string", () => {
  const result = formatHand([
    { rank: "A", suit: "S" },
    { rank: "10", suit: "H" },
  ]);
  assert.equal(result, "1:AS  2:10H");
});

test("formatVisualHand includes card borders", () => {
  const output = formatVisualHand([{ rank: "A", suit: "S" }]);
  assert.match(output, /\+-----/);
});

test("formatVisualHand includes suit symbols", () => {
  const output = formatVisualHand([
    { rank: "A", suit: "S" },
    { rank: "K", suit: "H" },
  ]);
  assert.match(output, /♠/);
  assert.match(output, /♥/);
});

test("formatVisualHand includes suit codes", () => {
  const output = formatVisualHand([{ rank: "A", suit: "S" }]);
  assert.match(output, /\|  S  \|/);
});

test("formatVisualHand includes cursor row when selectedIndex is provided", () => {
  const output = formatVisualHand(
    [
      { rank: "A", suit: "S" },
      { rank: "K", suit: "H" },
    ],
    0,
    new Set(),
  );
  assert.match(output.split("\n")[0], /v/);
});

test("formatVisualHand shows 交換 for exchange indexes", () => {
  const output = formatVisualHand([{ rank: "A", suit: "S" }], null, new Set([0]));
  assert.match(output, /交換/);
});

test("formatVisualHand shows 残す for non-exchange indexes", () => {
  const output = formatVisualHand([{ rank: "A", suit: "S" }], null, new Set());
  assert.match(output, /残す/);
});
