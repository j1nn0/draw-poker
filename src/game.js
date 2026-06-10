const SUITS = ["S", "H", "D", "C"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUES = new Map(RANKS.map((rank, index) => [rank, index + 2]));

export function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export function shuffleDeck(deck, random = Math.random) {
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function dealHand(deck, size = 5) {
  return {
    hand: deck.slice(0, size),
    deck: deck.slice(size),
  };
}

export function drawCards(hand, deck, heldIndexes) {
  const nextHand = [...hand];
  let deckIndex = 0;

  for (let index = 0; index < nextHand.length; index += 1) {
    if (!heldIndexes.has(index)) {
      nextHand[index] = deck[deckIndex];
      deckIndex += 1;
    }
  }

  return {
    hand: nextHand,
    deck: deck.slice(deckIndex),
  };
}

export function parseHoldInput(input) {
  const trimmed = input.trim();

  if (trimmed === "") {
    return new Set();
  }

  const indexes = new Set();

  for (const token of trimmed.split(/[\s,]+/)) {
    const cardNumber = Number(token);

    if (!Number.isInteger(cardNumber) || cardNumber < 1 || cardNumber > 5) {
      throw new Error("Hold choices must be card numbers from 1 to 5.");
    }

    indexes.add(cardNumber - 1);
  }

  return indexes;
}

export function evaluateHand(hand) {
  const values = hand.map((card) => RANK_VALUES.get(card.rank)).sort((a, b) => a - b);
  const counts = countRanks(values);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const flush = hand.every((card) => card.suit === hand[0].suit);
  const straight = isStraight(values);
  const highStraight = straight && values[0] === 10;

  if (flush && highStraight) {
    return { name: "Royal Flush", rank: 9 };
  }

  if (flush && straight) {
    return { name: "Straight Flush", rank: 8 };
  }

  if (groups[0] === 4) {
    return { name: "Four of a Kind", rank: 7 };
  }

  if (groups[0] === 3 && groups[1] === 2) {
    return { name: "Full House", rank: 6 };
  }

  if (flush) {
    return { name: "Flush", rank: 5 };
  }

  if (straight) {
    return { name: "Straight", rank: 4 };
  }

  if (groups[0] === 3) {
    return { name: "Three of a Kind", rank: 3 };
  }

  if (groups[0] === 2 && groups[1] === 2) {
    return { name: "Two Pair", rank: 2 };
  }

  if (groups[0] === 2) {
    return { name: "Pair", rank: 1 };
  }

  return { name: "High Card", rank: 0 };
}

export function formatHand(hand) {
  return hand.map((card, index) => `${index + 1}:${card.rank}${card.suit}`).join("  ");
}

export function formatVisualHand(hand, selectedIndex = null, exchangeIndexes = new Set()) {
  const cardLines = hand.map(formatCardLines);
  const lines = [
    hand.map((_, index) => (index === selectedIndex ? "   v   " : "       ")).join(" "),
    ...cardLines[0].map((_, lineIndex) => cardLines.map((card) => card[lineIndex]).join(" ")),
    hand.map((_, index) => (exchangeIndexes.has(index) ? "CHANGE " : " KEEP  ")).join(" "),
  ];

  return lines.join("\n");
}

function formatCardLines(card) {
  const suit = formatSuit(card.suit);
  const left = `${card.rank}${suit.symbol}`.padEnd(5, " ");
  const right = `${suit.symbol}${card.rank}`.padStart(5, " ");

  return ["+-----+", `|${left}|`, `|  ${suit.code}  |`, `|${right}|`, "+-----+"];
}

function formatSuit(suit) {
  const suits = new Map([
    ["S", { code: "S", symbol: "♠" }],
    ["H", { code: "H", symbol: "♥" }],
    ["D", { code: "D", symbol: "♦" }],
    ["C", { code: "C", symbol: "♣" }],
  ]);

  return suits.get(suit) ?? { code: suit, symbol: suit };
}

function countRanks(values) {
  const counts = new Map();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function isStraight(values) {
  const uniqueValues = new Set(values);

  if (uniqueValues.size !== 5) {
    return false;
  }

  const wheel = [2, 3, 4, 5, 14];

  if (values.every((value, index) => value === wheel[index])) {
    return true;
  }

  return values.every((value, index) => index === 0 || value === values[index - 1] + 1);
}
