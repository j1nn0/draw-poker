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
export function getPayTable() {
  return {
    "Royal Flush": [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 8000],
    "Straight Flush": [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    "Four of a Kind": [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500],
    "Full House": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    "Flush": [0, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70],
    "Straight": [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    "Three of a Kind": [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
    "Two Pair": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    "Pair": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "High Card": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

export function calculatePayout(handName, bet = 1) {
  const table = getPayTable();
  const multipliers = table[handName];
  if (!multipliers) return 0;
  return multipliers[bet] !== undefined ? multipliers[bet] : 0;
}
export function drawDoubleUpCards(deck) {
  return {
    dealerCard: deck[0],
    playerCards: [deck[1], deck[2], deck[3], deck[4]],
    remainingDeck: deck.slice(5),
  };
}

export function playDoubleUp(dealerCard, playerCard) {
  const dealerValue = RANK_VALUES.get(dealerCard.rank);
  const playerValue = RANK_VALUES.get(playerCard.rank);
  return playerValue > dealerValue;
}

export function formatHand(hand) {
  return hand.map((card, index) => `${index + 1}:${card.rank}${card.suit}`).join("  ");
}

export function formatVisualHand(hand, selectedIndex = null, exchangeIndexes = new Set()) {
  const cardLines = hand.map(formatCardLines);
  const lines = [
    hand.map((_, index) => (index === selectedIndex ? "   v   " : "       ")).join(" "),
    ...cardLines[0].map((_, lineIndex) => cardLines.map((card) => card[lineIndex]).join(" ")),
    hand.map((_, index) => (exchangeIndexes.has(index) ? "  交換 " : "  残す ")).join(" "),
  ];

  return lines.join("\n");
}

export function formatCardLines(card) {
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
