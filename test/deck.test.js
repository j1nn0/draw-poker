import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDeck, dealHand, shuffleDeck } from "../src/game.js";

describe("createDeck", () => {
  it("returns 52 cards", () => {
    const deck = createDeck();
    assert.equal(deck.length, 52);
  });

  it("has no duplicate rank+suit cards", () => {
    const deck = createDeck();
    const keys = deck.map((c) => c.rank + c.suit);
    const unique = new Set(keys);
    assert.equal(unique.size, 52, "duplicate cards found");
  });

  it("contains all 4 suits and 13 ranks", () => {
    const deck = createDeck();
    const suits = [...new Set(deck.map((c) => c.suit))].sort();
    const ranks = [...new Set(deck.map((c) => c.rank))].sort();
    assert.deepEqual(suits, ["C", "D", "H", "S"]);
    assert.equal(ranks.length, 13);
  });
});

describe("dealHand", () => {
  it("returns 5 cards and a 47-card remaining deck by default", () => {
    const deck = createDeck();
    const { hand, deck: remaining } = dealHand(deck);
    assert.equal(hand.length, 5);
    assert.equal(remaining.length, 47);
  });

  it("dealHand(deck, 3) returns 3 cards and a 49-card remaining deck", () => {
    const deck = createDeck();
    const { hand, deck: remaining } = dealHand(deck, 3);
    assert.equal(hand.length, 3);
    assert.equal(remaining.length, 49);
  });
});

describe("shuffleDeck", () => {
  it("does not mutate the input deck", () => {
    const deck = createDeck();
    const original = deck.map((c) => c.rank + c.suit);
    shuffleDeck(deck, () => 0.5);
    const after = deck.map((c) => c.rank + c.suit);
    assert.deepEqual(after, original);
  });

  it("result is a permutation of the input deck", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, () => 0.5);
    assert.equal(shuffled.length, deck.length);
    const deckCounts = {};
    for (const card of deck) {
      const key = card.rank + card.suit;
      deckCounts[key] = (deckCounts[key] || 0) + 1;
    }
    for (const card of shuffled) {
      const key = card.rank + card.suit;
      deckCounts[key] -= 1;
    }
    for (const count of Object.values(deckCounts)) {
      assert.equal(count, 0, "shuffle result is not a permutation");
    }
  });

  it("with a deterministic random sequence, repeated runs produce the same output", () => {
    const deck = createDeck();
    const seqA = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    const seqB = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    let callCountA = 0;
    let callCountB = 0;
    const randomA = () => seqA[callCountA++ % seqA.length];
    const randomB = () => seqB[callCountB++ % seqB.length];

    const resultA = shuffleDeck(deck, randomA);
    const resultB = shuffleDeck(deck, randomB);

    for (let i = 0; i < deck.length; i++) {
      assert.equal(
        resultA[i].rank + resultA[i].suit,
        resultB[i].rank + resultB[i].suit,
        "same random sequence produced different order",
      );
    }
  });

  it("a different random sequence changes the order", () => {
    const deck = createDeck();
    const seqA = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    const seqB = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
    let callCountA = 0;
    let callCountB = 0;
    const randomA = () => seqA[callCountA++ % seqA.length];
    const randomB = () => seqB[callCountB++ % seqB.length];

    const resultA = shuffleDeck(deck, randomA);
    const resultB = shuffleDeck(deck, randomB);

    let anyDifferent = false;
    for (let i = 0; i < deck.length; i++) {
      if (resultA[i].rank + resultA[i].suit !== resultB[i].rank + resultB[i].suit) {
        anyDifferent = true;
        break;
      }
    }
    assert.ok(anyDifferent, "different random sequences should produce different order");
  });
});

describe("shuffleDeck with tiny fixture", () => {
  it("result is a permutation with a tiny custom deck", () => {
    const tiny = [
      { rank: "2", suit: "S" },
      { rank: "3", suit: "S" },
      { rank: "4", suit: "S" },
    ];
    const shuffled = shuffleDeck(tiny, () => 0.9);
    const tinyKeys = tiny.map((c) => c.rank + c.suit);
    const shuffledKeys = shuffled.map((c) => c.rank + c.suit);
    assert.deepEqual([...new Set(shuffledKeys)].sort(), [...new Set(tinyKeys)].sort());
    assert.equal(shuffled.length, tiny.length);
  });
});
