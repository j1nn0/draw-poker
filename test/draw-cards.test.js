import assert from "node:assert/strict";
import test from "node:test";

import { drawCards } from "../src/game.js";

// Exchange Selection: drawCards(hand, deck, heldIndexes) consumes the inverse
// set of cards retained — the heldIndexes mark positions to PRESERVE, while
// non-held positions are exchanged from the top of the deck in order.

test("Exchange Selection — empty held-index set exchanges all 5 cards, preserving draw order", () => {
  const hand = [
    { rank: "2", suit: "S" },
    { rank: "3", suit: "H" },
    { rank: "4", suit: "D" },
    { rank: "5", suit: "C" },
    { rank: "6", suit: "S" },
  ];
  const deck = [
    { rank: "K", suit: "S" },
    { rank: "Q", suit: "H" },
    { rank: "J", suit: "D" },
    { rank: "10", suit: "C" },
    { rank: "9", suit: "S" },
  ];

  const result = drawCards(hand, deck, new Set());

  // All hand positions replaced by top of deck in order
  assert.deepEqual(result.hand, [
    { rank: "K", suit: "S" },
    { rank: "Q", suit: "H" },
    { rank: "J", suit: "D" },
    { rank: "10", suit: "C" },
    { rank: "9", suit: "S" },
  ]);
  // Deck consumed exactly 5 replacement cards
  assert.deepEqual(result.deck, []);
});

test("Exchange Selection — held indexes {0, 2, 4} preserve those positions and replace 1 and 3 from deck top", () => {
  const hand = [
    { rank: "A", suit: "S" },
    { rank: "2", suit: "H" },
    { rank: "3", suit: "D" },
    { rank: "4", suit: "C" },
    { rank: "5", suit: "S" },
  ];
  const deck = [
    { rank: "K", suit: "S" },
    { rank: "Q", suit: "H" },
    { rank: "J", suit: "D" },
    { rank: "10", suit: "C" },
    { rank: "9", suit: "S" },
  ];

  const result = drawCards(hand, deck, new Set([0, 2, 4]));

  // Positions 0, 2, 4 unchanged
  assert.equal(result.hand[0].rank, "A");
  assert.equal(result.hand[2].rank, "3");
  assert.equal(result.hand[4].rank, "5");
  // Positions 1 and 3 replaced from top of deck in order
  assert.equal(result.hand[1].rank, "K");
  assert.equal(result.hand[3].rank, "Q");
  // Deck had 2 cards consumed
  assert.deepEqual(result.deck, [
    { rank: "J", suit: "D" },
    { rank: "10", suit: "C" },
    { rank: "9", suit: "S" },
  ]);
});

test("Exchange Selection — all held indexes {0, 1, 2, 3, 4} preserve original hand, deck unchanged", () => {
  const hand = [
    { rank: "10", suit: "S" },
    { rank: "J", suit: "H" },
    { rank: "Q", suit: "D" },
    { rank: "K", suit: "C" },
    { rank: "A", suit: "S" },
  ];
  const deck = [
    { rank: "9", suit: "S" },
    { rank: "8", suit: "H" },
    { rank: "7", suit: "D" },
    { rank: "6", suit: "C" },
    { rank: "5", suit: "S" },
  ];

  const result = drawCards(hand, deck, new Set([0, 1, 2, 3, 4]));

  // Hand unchanged
  assert.deepEqual(result.hand, hand);
  // Deck untouched — zero cards consumed
  assert.deepEqual(result.deck, deck);
});

test("Returned deck removes exactly the consumed replacement cards", () => {
  const hand = [
    { rank: "2", suit: "S" },
    { rank: "3", suit: "H" },
    { rank: "4", suit: "D" },
  ];
  const deck = [
    { rank: "K", suit: "S" },
    { rank: "Q", suit: "H" },
    { rank: "J", suit: "D" },
    { rank: "10", suit: "C" },
    { rank: "9", suit: "S" },
  ];

  const result = drawCards(hand, deck, new Set([0]));

  // Only position 0 has 2 non-held positions (1 and 2)
  assert.equal(result.hand[0].rank, "2"); // held
  assert.equal(result.hand[1].rank, "K"); // replaced
  assert.equal(result.hand[2].rank, "Q"); // replaced
  // Deck has 3 cards remaining (5 - 2 consumed)
  assert.deepEqual(result.deck, [
    { rank: "J", suit: "D" },
    { rank: "10", suit: "C" },
    { rank: "9", suit: "S" },
  ]);
});
