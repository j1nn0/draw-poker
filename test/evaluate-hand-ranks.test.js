import assert from "node:assert/strict";
import test from "node:test";

import { evaluateHand } from "../src/game.js";

/** @param {string} code - e.g. "2S", "10H", "AS" */
function card(code) {
  const rank = code.slice(0, -1);
  const suit = code.at(-1);
  return { rank, suit };
}

const RANK_CASES = [
  { name: "High Card", rank: 0, cards: ["2S", "5H", "9D", "JC", "KC"] },
  { name: "Pair", rank: 1, cards: ["JS", "JH", "5D", "9C", "KH"] },
  { name: "Pair", rank: 1, cards: ["2S", "2H", "5D", "9C", "KH"] },
  { name: "Two Pair", rank: 2, cards: ["2S", "2H", "5D", "5C", "KH"] },
  { name: "Three of a Kind", rank: 3, cards: ["7S", "7H", "7D", "2C", "QH"] },
  { name: "Straight", rank: 4, cards: ["4S", "5H", "6D", "7C", "8H"] },
  { name: "Flush", rank: 5, cards: ["2H", "5H", "9H", "JH", "KH"] },
  { name: "Full House", rank: 6, cards: ["3S", "3H", "3D", "9C", "9H"] },
  { name: "Four of a Kind", rank: 7, cards: ["QS", "QH", "QD", "QC", "2S"] },
  { name: "Straight Flush", rank: 8, cards: ["5S", "6S", "7S", "8S", "9S"] },
  { name: "Royal Flush", rank: 9, cards: ["10S", "JS", "QS", "KS", "AS"] },
];

for (const { name, rank, cards } of RANK_CASES) {
  test(`evaluateHand returns ${name} for rank ${rank}`, () => {
    const hand = cards.map(card);
    const result = evaluateHand(hand);
    assert.equal(result.name, name);
    assert.equal(result.rank, rank);
  });
}
