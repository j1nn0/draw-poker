import assert from "node:assert/strict";
import test from "node:test";

import { evaluateHand } from "../src/game.js";

function card(code) {
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  return { rank, suit };
}

test("ace-low wheel off-suit is Straight, not Royal Flush", () => {
  const result = evaluateHand([card("AS"), card("2H"), card("3D"), card("4C"), card("5S")]);

  assert.equal(result.name, "Straight");
  assert.equal(result.rank, 4);
});

test("ace-low wheel suited is Straight Flush, not Royal Flush", () => {
  const result = evaluateHand([card("AS"), card("2S"), card("3S"), card("4S"), card("5S")]);

  assert.equal(result.name, "Straight Flush");
  assert.equal(result.rank, 8);
});

test("off-suit broadway is Straight, not Royal Flush", () => {
  const result = evaluateHand([card("10S"), card("JH"), card("QD"), card("KC"), card("AS")]);

  assert.equal(result.name, "Straight");
  assert.equal(result.rank, 4);
});
