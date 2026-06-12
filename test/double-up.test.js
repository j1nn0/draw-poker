import assert from "node:assert/strict";
import test from "node:test";
import { drawDoubleUpCards, playDoubleUp } from "../src/game.js";

test("drawDoubleUpCards returns dealer card, 4 player cards, and remaining deck", () => {
  const deck = [
    { rank: "2", suit: "S" },
    { rank: "3", suit: "H" },
    { rank: "4", suit: "D" },
    { rank: "5", suit: "C" },
    { rank: "6", suit: "S" },
    { rank: "7", suit: "H" },
  ];

  const result = drawDoubleUpCards(deck);
  assert.deepEqual(result.dealerCard, { rank: "2", suit: "S" });
  assert.deepEqual(result.playerCards, [
    { rank: "3", suit: "H" },
    { rank: "4", suit: "D" },
    { rank: "5", suit: "C" },
    { rank: "6", suit: "S" },
  ]);
  assert.deepEqual(result.remainingDeck, [{ rank: "7", suit: "H" }]);
});

test("playDoubleUp returns win when player card is higher", () => {
  const dealerCard = { rank: "5", suit: "S" };
  const playerCard = { rank: "A", suit: "H" };
  assert.equal(playDoubleUp(dealerCard, playerCard), "win");
});


test("playDoubleUp returns lose when player card is lower", () => {
  const dealerCard = { rank: "K", suit: "S" };
  const playerCard = { rank: "2", suit: "H" };
  assert.equal(playDoubleUp(dealerCard, playerCard), "lose");
});

test("playDoubleUp returns push when player card is same rank", () => {
  const dealerCard = { rank: "7", suit: "S" };
  const playerCard = { rank: "7", suit: "H" };
  assert.equal(playDoubleUp(dealerCard, playerCard), "push");
});


test("playDoubleUp works with edge ranks", () => {
  assert.equal(playDoubleUp({ rank: "2", suit: "S" }, { rank: "3", suit: "H" }), "win");
  assert.equal(playDoubleUp({ rank: "A", suit: "S" }, { rank: "K", suit: "H" }), "lose");
  assert.equal(playDoubleUp({ rank: "Q", suit: "S" }, { rank: "A", suit: "H" }), "win");
  assert.equal(playDoubleUp({ rank: "A", suit: "S" }, { rank: "A", suit: "H" }), "push");
});

